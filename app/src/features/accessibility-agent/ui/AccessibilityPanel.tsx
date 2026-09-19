import { useEffect, useRef, useState } from 'react';
import {
  Accessibility, BookOpenText, Bot, Check, ChevronLeft, FlaskConical, Info,
  Languages, Mic, Send, SlidersHorizontal, Sparkles, Square, Undo2, Volume2, X,
} from 'lucide-react';
import type { AccessibilityPreferences, JourneyStep } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { getPublicContentTargets, resolvePublicContent } from '../adapters/clickbus/content';
import { RYBENA_SIMULATION_NOTICE } from '../adapters/libras/contracts';
import { librasAdapter } from '../adapters/libras/selection';
import {
  ALL_ACTION_TYPES,
  CONTRACT_VERSION,
  type ActionType,
  type PlanAction,
  type PlannerResponse,
} from '../core/contracts';
import { AccessibilityExecutor, formatExecutionReceipt, type ExecutionReceipt } from '../core/executor';
import { AccessibilityServiceError, createRequestId, requestPlan } from '../core/plannerClient';
import { getActivePreferenceLabels, type PreferencePatch } from '../core/preferences';
import { AboutSurface } from './AboutSurface';
import { ContentTools } from './ContentTools';
import { FeatureGrid, type FeatureCard } from './FeatureGrid';
import { PlayerSurface } from './PlayerSurface';
import { PreferenceControls } from './PreferenceControls';
import { useVoiceInput } from './useVoiceInput';
import { focusAfterRender } from '../../../utils/focus';

/**
 * Padrão lançador + superfície. Uma superfície ativa por vez, `root` por
 * padrão. O `tablist` anterior saiu: cartão que navega para outra superfície é
 * `<button>`, percorrido por `Tab`, não `role="tab"`.
 */
type PanelSurface = 'root' | 'libras' | 'voice' | 'settings' | 'content' | 'about';

interface AccessibilityPanelProps {
  canUndo: boolean;
  getPreferences(): AccessibilityPreferences;
  getStateRevision(): number;
  onApply(patch: PreferencePatch): boolean;
  onClose(): void;
  onSelectionModeChange?(active: boolean): void;
  onReset(): boolean;
  onUndo(): boolean;
  page: JourneyStep;
  pageEpoch: number;
  panelSession: number;
  preferences: AccessibilityPreferences;
  stateRevision: number;
  storageAvailable: boolean;
}

/** Ações cujo efeito a transação de desfazer de `preferences.ts` alcança. */
const UNDOABLE_ACTIONS: readonly ActionType[] = [
  'set_preferences', 'apply_comfortable_reading', 'reset_preferences',
];

const VISUAL_CAPABILITIES: readonly ActionType[] = [
  'set_preferences', 'apply_comfortable_reading', 'undo_preferences', 'reset_preferences',
];

const LIBRAS_CAPABILITIES: readonly ActionType[] = [
  'open_libras', 'close_libras', 'pause_libras', 'resume_libras', 'stop_libras', 'set_libras_speed',
];

const VOICE_CAPABILITIES: readonly ActionType[] = [
  'open_voice', 'close_voice', 'pause_voice', 'resume_voice', 'stop_voice',
];

/**
 * A lista enviada ao planejador é a lista do que o executor aceitaria agora.
 * Sem trecho público — checkout e confirmação — as ações ligadas a conteúdo
 * saem, o que também impede que dados de passageiro cheguem ao planejador.
 * Com o player permanentemente indisponível, Libras e voz saem inteiras.
 */
const currentCapabilities = (playerAvailable: boolean, hasContent: boolean): ActionType[] => {
  const capabilities = [...VISUAL_CAPABILITIES];
  if (playerAvailable) {
    capabilities.push(...LIBRAS_CAPABILITIES, ...VOICE_CAPABILITIES);
    if (hasContent) capabilities.push('translate_content', 'speak_content');
  }
  return capabilities.filter((type): type is ActionType => ALL_ACTION_TYPES.includes(type));
};

const SURFACE_TITLES: Record<Exclude<PanelSurface, 'root'>, string> = {
  libras: 'Libras',
  voice: 'Voz',
  settings: 'Ajustes visuais',
  content: 'Conteúdo',
  about: 'Sobre acessibilidade',
};

/**
 * Tom da faixa de estado. Cada um corresponde a um desfecho real e visível:
 * enviando, indisponível (503), limite atingido (429), erro (502 e afins).
 * Nenhum deles finge que o pedido foi aplicado.
 */
type StatusTone = 'neutral' | 'busy' | 'warning' | 'error';

const toneForError = (error: unknown): StatusTone => {
  if (!(error instanceof AccessibilityServiceError)) return 'error';
  if (error.kind === 'unavailable' || error.kind === 'rate_limited' || error.kind === 'busy') return 'warning';
  if (error.kind === 'cancelled') return 'neutral';
  return 'error';
};

const ACTION_LABELS: Record<ActionType, string> = {
  set_preferences: 'Alterar as preferências indicadas',
  apply_comfortable_reading: 'Aplicar o conjunto Leitura confortável',
  undo_preferences: 'Desfazer o último ajuste',
  reset_preferences: 'Restaurar a aparência padrão',
  open_libras: 'Abrir o player em Libras',
  close_libras: 'Fechar o player',
  translate_content: 'Traduzir o trecho escolhido em Libras',
  pause_libras: 'Pausar a tradução em Libras',
  resume_libras: 'Retomar a tradução em Libras',
  stop_libras: 'Parar a tradução em Libras',
  set_libras_speed: 'Mudar a velocidade do player',
  open_voice: 'Abrir o player em voz',
  close_voice: 'Fechar o player',
  speak_content: 'Narrar o trecho escolhido em voz',
  pause_voice: 'Pausar a narração',
  resume_voice: 'Retomar a narração',
  stop_voice: 'Parar a narração',
};

const describeAction = (action: PlanAction) => ACTION_LABELS[action.type];

export function AccessibilityPanel(props: AccessibilityPanelProps) {
  const [surface, setSurface] = useState<PanelSurface>('root');
  const [request, setRequest] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState<StatusTone>('neutral');
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<PlannerResponse | null>(null);
  // Desfazer só aparece depois de um plano que de fato mexeu em preferências.
  const [undoOffered, setUndoOffered] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const executorRef = useRef(new AccessibilityExecutor());
  const requestControllerRef = useRef<AbortController | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const firstRenderRef = useRef(true);
  const openedFromRef = useRef<Exclude<PanelSurface, 'root'> | null>(null);
  const voice = useVoiceInput();
  const activeLabels = getActivePreferenceLabels(props.preferences);
  const targets = getPublicContentTargets(props.page);
  const player = librasAdapter.getSnapshot();
  // Aviso permanente: simulacao nunca pode ser confundida com traducao real.
  const librasSimulated = player.simulated;
  const playerAvailable = player.state !== 'unavailable_pending_provider_configuration';
  const capabilities = currentCapabilities(playerAvailable, targets.length > 0);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  useEffect(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setBusy(false);
  }, [props.stateRevision]);

  // Troca de superfície: foco vai para o "Voltar" ao entrar e volta para o
  // cartão de origem ao sair. O foco da primeira abertura é do host.
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return undefined;
    }
    const selector = surface === 'root' && openedFromRef.current
      ? `#a11y-card-${openedFromRef.current}`
      : '[data-a11y-entry]';
    const timer = focusAfterRender(() => panelRef.current?.querySelector<HTMLElement>(selector));
    // Rolagem é efeito visual: aqui `requestAnimationFrame` é o certo.
    const frame = window.requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: 0, behavior: 'auto' }));
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [surface]);

  const openSurface = (next: Exclude<PanelSurface, 'root'>) => {
    openedFromRef.current = next;
    setSurface(next);
  };

  const dependencies = (requestId: string) => ({
    requestId,
    getStateRevision: props.getStateRevision,
    getPageEpoch: () => props.pageEpoch,
    getPanelSession: () => props.panelSession,
    getPreferences: props.getPreferences,
    applyPreferences: props.onApply,
    undoPreferences: props.onUndo,
    resetPreferences: props.onReset,
    resolveContent: (id: string) => resolvePublicContent(props.page, id),
    rybena: librasAdapter,
    capabilities,
  });

  const announce = (message: string, nextTone: StatusTone = 'neutral') => {
    setTone(nextTone);
    setStatus(message);
  };

  const offersUndo = (receipt: ExecutionReceipt) => receipt.actions.some(
    (item) => item.status === 'applied' && UNDOABLE_ACTIONS.includes(item.action),
  );

  const execute = async (plan: PlannerResponse) => {
    try {
      const receipt = await executorRef.current.execute(plan, dependencies(plan.requestId));
      const rejected = receipt.status === 'rejected';
      announce(
        formatExecutionReceipt(receipt) || plan.message,
        rejected ? 'error' : receipt.status === 'partial' ? 'warning' : 'neutral',
      );
      setUndoOffered(offersUndo(receipt));
      setProposal(null);
    } catch (error) {
      announce(error instanceof Error ? error.message : 'O plano não pôde ser aplicado.', 'error');
      setUndoOffered(false);
    }
  };

  const askAssistant = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = request.trim();
    if (!message || busy) return;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const requestId = createRequestId();
    setBusy(true);
    setProposal(null);
    setUndoOffered(false);
    announce('Analisando seu pedido com o planejador seguro…', 'busy');
    try {
      const response = await requestPlan({
        contractVersion: CONTRACT_VERSION,
        requestId,
        message,
        context: {
          stateRevision: props.getStateRevision(),
          pageEpoch: props.pageEpoch,
          panelSession: props.panelSession,
          canUndo: props.canUndo,
          librasState: librasAdapter.getSnapshot().state,
          preferences: props.getPreferences(),
          capabilities,
          contentTargets: targets.map(({ id, label }) => ({ id, label })),
        },
        history: history.slice(-6),
      }, controller.signal);
      setHistory((current) => [...current, { role: 'user' as const, content: message }, { role: 'assistant' as const, content: response.message }].slice(-6));
      setRequest('');
      // O destino — ferramentas visuais, Libras ou voz — vem das AÇÕES do plano.
      // O cliente não adivinha por texto; o executor revalida tudo de novo.
      if (response.mode === 'propose') {
        setProposal(response);
        announce(response.message, 'warning');
      } else if (response.mode === 'apply') {
        await execute(response);
      } else {
        // `clarify` pergunta, `unsupported` recusa. Nenhum dos dois aplica nada.
        announce(response.message, response.mode === 'unsupported' ? 'warning' : 'neutral');
      }
    } catch (error) {
      announce(
        error instanceof Error ? error.message : 'O assistente não conseguiu responder.',
        toneForError(error),
      );
    } finally {
      if (requestControllerRef.current === controller) setBusy(false);
    }
  };

  const cards: readonly FeatureCard<Exclude<PanelSurface, 'root'>>[] = [
    {
      id: 'libras',
      label: 'Libras',
      description: 'Traduzir um trecho público desta tela em Libras.',
      icon: Languages,
      note: librasSimulated ? 'Simulação' : player.mode === 'libras' && player.state === 'translating' ? 'Traduzindo' : undefined,
    },
    {
      id: 'voice',
      label: 'Voz',
      description: 'Ouvir a narração de um trecho público desta tela.',
      icon: Volume2,
      note: librasSimulated ? 'Simulação' : player.mode === 'voz' && player.state === 'translating' ? 'Narrando' : undefined,
    },
    { id: 'settings', label: 'Ajustes visuais', description: 'Contraste, tamanho do texto, cores, espaçamento, guia e máscara.', icon: SlidersHorizontal },
    { id: 'content', label: 'Conteúdo', description: 'Explicar um termo ou simplificar um trecho desta tela.', icon: BookOpenText },
  ];

  // Sugestões do chat. Só preenchem o campo: nada é enviado sem ação explícita.
  const SUGGESTIONS = ['Aumentar o texto', 'Mais contraste', 'Ler isto em Libras'];

  return (
    <section
      className={`accessibility-panel${librasSimulated ? ' accessibility-panel--simulated' : ''}`}
      aria-label="Acessibilidade assistida por IA"
      ref={panelRef}
    >
      <div className="accessibility-panel__heading">
        <Accessibility aria-hidden="true" size={22} />
        <div><h2>Acessibilidade</h2><p>Ajustes que acompanham você.</p></div>
        <svg className="a11y-route-mark" viewBox="0 0 96 40" aria-hidden="true" focusable="false">
          <path d="M9 9h22c13 0 13 22 27 22h28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="8" cy="9" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="87" cy="31" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <button className="panel-close" type="button" aria-label="Fechar o painel de acessibilidade" onClick={props.onClose}><X aria-hidden="true" /></button>
      </div>

      {librasSimulated ? (
        <p className="a11y-simulation-notice">
          <FlaskConical aria-hidden="true" />
          <span>
            <strong>{RYBENA_SIMULATION_NOTICE}.</strong>{' '}
            Os controles percorrem os estados do player sem rede e sem tradução real. Nada aqui prova o funcionamento da Rybená.
          </span>
        </p>
      ) : null}

      <div className="a11y-surface" ref={bodyRef}>
        {surface === 'root' ? (
          <>
            <FeatureGrid cards={cards} onOpen={openSurface} />

            <button id="a11y-card-about" className="a11y-about-link" type="button" onClick={() => openSurface('about')}>
              <Info aria-hidden="true" /> Sobre acessibilidade
            </button>

            {activeLabels.length > 0 ? (
              <div className="active-preferences">
                <div><strong>Agora na página</strong><span>Revisão {props.stateRevision}</span></div>
                <div className="preference-chips">{activeLabels.map((label) => <span key={label}><Check aria-hidden="true" />{label}</span>)}</div>
              </div>
            ) : null}
            {!props.storageAvailable ? <p className="storage-warning" role="status">As preferências funcionam nesta sessão, mas este navegador bloqueou o salvamento local.</p> : null}
          </>
        ) : (
          <>
            <div className="a11y-surface__bar">
              <button className="a11y-back" type="button" data-a11y-entry="true" onClick={() => setSurface('root')}>
                <ChevronLeft aria-hidden="true" /> Voltar aos recursos
              </button>
              <h3 className="a11y-surface__title">{SURFACE_TITLES[surface]}</h3>
            </div>

            {surface === 'libras' || surface === 'voice' ? (
              <PlayerSurface
                mode={surface === 'voice' ? 'voz' : 'libras'}
                playerSpeed={props.preferences.librasSpeed}
                onSpeedChange={(librasSpeed) => props.onApply({ librasSpeed })}
                page={props.page}
              />
            ) : null}

            {surface === 'settings' ? (
              <PreferenceControls
                canUndo={props.canUndo}
                preferences={props.preferences}
                onApply={props.onApply}
                onReset={props.onReset}
                onUndo={props.onUndo}
                onStatus={(message) => announce(message)}
              />
            ) : null}

            {surface === 'content' ? (
              <ContentTools page={props.page} onSelectionModeChange={props.onSelectionModeChange} />
            ) : null}

            {surface === 'about' ? <AboutSurface /> : null}
          </>
        )}
      </div>

      <div className="a11y-chat">
        <form className="a11y-chat__form" onSubmit={askAssistant}>
          <label htmlFor="accessibility-request"><Bot aria-hidden="true" /> Peça uma adaptação</label>
          <div className="a11y-chat__suggestions" role="group" aria-label="Sugestões de pedido">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                className="a11y-chat__suggestion"
                type="button"
                onClick={() => setRequest(suggestion.toLowerCase())}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="a11y-chat__row">
            <textarea
              id="accessibility-request"
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Ex.: aumente o texto e reduza o movimento"
            />
            <div className="a11y-chat__buttons">
              {voice.supported ? (
                <button
                  className="a11y-chat__icon-button"
                  type="button"
                  aria-pressed={voice.active}
                  aria-label={voice.active ? 'Parar o ditado por voz' : 'Ditar o pedido por voz'}
                  onClick={voice.active ? voice.stop : voice.start}
                >
                  {voice.active ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
                </button>
              ) : null}
              <button
                className="a11y-chat__icon-button a11y-chat__icon-button--send"
                type="submit"
                aria-label={busy ? 'Analisando o pedido' : 'Enviar pedido ao assistente'}
                disabled={busy || request.trim().length === 0}
              >
                <Sparkles aria-hidden="true" />
              </button>
            </div>
          </div>
          {voice.active ? <p className="voice-active">Microfone ativo. Revise a transcrição antes de enviar.</p> : null}
          {voice.transcript ? (
            <Button variant="secondary" onClick={() => { setRequest(voice.transcript); announce('Transcrição copiada para o campo. Revise antes de enviar.'); }}>
              <Send aria-hidden="true" /> Usar transcrição
            </Button>
          ) : null}
          {voice.error ? <p className="field-error" role="alert">{voice.error}</p> : null}
          <small>
            A IA apenas propõe ações do contrato. O executor local valida tudo antes de alterar a tela.
            {playerAvailable ? '' : ' Libras e voz estão indisponíveis neste ambiente: o assistente não vai oferecê-las.'}
          </small>
        </form>

        {proposal ? (
          <div className="assistant-proposal">
            <strong>Confirme antes de aplicar</strong>
            <p>{proposal.message}</p>
            <ul>{proposal.actions.map((action, index) => <li key={`${action.type}-${index}`}>{describeAction(action)}</li>)}</ul>
            <div>
              <Button variant="quiet" onClick={() => { setProposal(null); announce('Proposta cancelada. Nada foi alterado.'); }}>Cancelar</Button>
              <Button onClick={() => void execute(proposal)}>Aplicar proposta</Button>
            </div>
          </div>
        ) : null}

        <p className={`assistant-message assistant-message--${tone}`} role="status" aria-atomic="true">{status}</p>

        {undoOffered ? (
          <div className="a11y-chat__undo">
            <Button
              variant="quiet"
              onClick={() => {
                announce(props.onUndo() ? 'Último ajuste desfeito.' : 'Não há ajuste para desfazer.');
                setUndoOffered(false);
              }}
            >
              <Undo2 aria-hidden="true" /> Desfazer este ajuste
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
