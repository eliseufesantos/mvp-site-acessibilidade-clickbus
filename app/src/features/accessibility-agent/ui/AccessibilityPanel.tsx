import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Bot, Check, ChevronLeft, FlaskConical, Info,
  Languages, Mic, Send, SlidersHorizontal, Sparkles, Square, Undo2, Volume2, X,
} from 'lucide-react';
import type { AccessibilityPreferences, JourneyStep } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { UniversalAccessIcon } from '../../../components/accessibility/UniversalAccessIcon';
import { getPublicContentTargets, resolvePublicContent, simplifyPublicContent } from '../adapters/clickbus/content';
import { explainFromGlossary, matchGlossaryQuestion } from '../core/glossary';
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
import {
  AccessibilityServiceError,
  createRequestId,
  requestExplanation,
  requestPlan,
  requestSimplification,
} from '../core/plannerClient';
import { getActivePreferenceLabels, type PreferencePatch } from '../core/preferences';
import { AboutSurface } from './AboutSurface';
import { FeatureGrid, type FeatureCard } from './FeatureGrid';
import { PreferenceControls } from './PreferenceControls';
import { useVoiceInput } from './useVoiceInput';
import { focusAfterRender } from '../../../utils/focus';

/**
 * Padrão lançador + superfície. Uma superfície ativa por vez, `root` por
 * padrão. O `tablist` anterior saiu: cartão que navega para outra superfície é
 * `<button>`, percorrido por `Tab`, não `role="tab"`.
 */
type PanelSurface = 'root' | 'settings' | 'about';
type CardId = 'libras' | 'voice' | 'settings' | 'about';

interface AccessibilityPanelProps {
  canUndo: boolean;
  getPreferences(): AccessibilityPreferences;
  getStateRevision(): number;
  onApply(patch: PreferencePatch): boolean;
  onClose(): void;
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

const CONTENT_CAPABILITIES: readonly ActionType[] = ['explain_term', 'simplify_content'];

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
  // Explicar não depende de trecho: o glossário responde por termo. Simplificar
  // depende, porque precisa de um alvo público — é o que mantém checkout fora.
  capabilities.push('explain_term');
  if (hasContent) capabilities.push('simplify_content');
  if (playerAvailable) {
    capabilities.push(...LIBRAS_CAPABILITIES, ...VOICE_CAPABILITIES);
    if (hasContent) capabilities.push('translate_content', 'speak_content');
  }
  return capabilities.filter((type): type is ActionType => ALL_ACTION_TYPES.includes(type));
};

const SURFACE_TITLES: Record<Exclude<PanelSurface, 'root'>, string> = {
  settings: 'Ajustes visuais',
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
  explain_term: 'Explicar o termo perguntado',
  simplify_content: 'Simplificar o trecho indicado',
  open_voice: 'Abrir o player em voz',
  close_voice: 'Fechar o player',
  speak_content: 'Narrar o trecho escolhido em voz',
  pause_voice: 'Pausar a narração',
  resume_voice: 'Retomar a narração',
  stop_voice: 'Parar a narração',
};

const describeAction = (action: PlanAction) => ACTION_LABELS[action.type];

/**
 * O que o assistente faz, em uma frase, escrita por nós.
 *
 * A recusa de `mode=unsupported` é texto livre do modelo, validado apenas como
 * string curta. Acrescentar esta linha garante que a pessoa sempre leia o
 * escopo real — e distingue "não faço isso" de "tente de novo mais tarde", que
 * compartilham o mesmo tom de aviso.
 */
const SCOPE_NOTICE = 'Só ajusto a leitura desta página e explico palavras da viagem.';

export function AccessibilityPanel(props: AccessibilityPanelProps) {
  const [surface, setSurface] = useState<PanelSurface>('root');
  const [request, setRequest] = useState('');
  const [status, setStatus] = useState('');
  const [tone, setTone] = useState<StatusTone>('neutral');
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<PlannerResponse | null>(null);
  // Desfazer só aparece depois de um plano que de fato mexeu em preferências.
  const [undoOffered, setUndoOffered] = useState(false);
  const [answer, setAnswer] = useState<{ text: string; source: 'local' | 'service' } | null>(null);
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
  // O snapshot precisa ser assinado: lido direto no render, ele congelava no
  // último render feito por outro motivo, e os selos "Aberta"/"Narrando"
  // mostravam o estado anterior do player.
  const player = useSyncExternalStore(librasAdapter.subscribe, librasAdapter.getSnapshot);
  // Aviso permanente: simulacao nunca pode ser confundida com traducao real.
  const librasSimulated = player.simulated;
  const playerAvailable = player.state !== 'unavailable_pending_provider_configuration';
  const capabilities = currentCapabilities(playerAvailable, targets.length > 0);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  // A conversa cresce para baixo. Sem rolar, a resposta recém-chegada nascia
  // fora da área visível e a pessoa via o turno anterior cortado ao meio.
  // Quem rola é o painel: o campo de envio fica grudado na base e a mensagem
  // mais recente para logo acima dele.
  useEffect(() => {
    // Em quadro seguinte: o campo é `position: sticky`, e medir a altura antes
    // de o layout assentar devolvia um `scrollHeight` menor que o final — a
    // rolagem parava no meio e a resposta nova ficava atrás do campo.
    const frame = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (panel) panel.scrollTop = panel.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [history, status, answer, proposal, undoOffered]);

  useEffect(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setBusy(false);
  }, [props.stateRevision]);

  // O painel agora continua aberto ao trocar de etapa. Uma proposta feita na
  // etapa anterior seria recusada pelo executor, porque `pageEpoch` mudou:
  // melhor recolhê-la do que oferecer um botão que vai falhar.
  useEffect(() => {
    setProposal(null);
    setAnswer(null);
    setUndoOffered(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.pageEpoch]);

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
    const frame = window.requestAnimationFrame(() => panelRef.current?.scrollTo({ top: 0, behavior: 'auto' }));
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [surface]);

  const openSurface = (next: Exclude<PanelSurface, 'root'>) => {
    openedFromRef.current = next;
    setSurface(next);
  };

  /**
   * Libras e Voz não têm superfície intermediária: abrem a aplicação da
   * Rybená, e a seleção de texto acontece na interface dela.
   */
  const startRybena = async (mode: 'libras' | 'voz') => {
    const rotulo = mode === 'voz' ? 'narração em voz' : 'tradução em Libras';
    announce(`Abrindo a ${rotulo}…`, 'busy');
    const ready = await librasAdapter.initialize();
    if (ready.status !== 'accepted') {
      announce(ready.message, 'error');
      return;
    }
    // O recibo de `setMode` era descartado, então uma troca de modo que falhava
    // seguia para `open()` e era anunciada como sucesso.
    const switched = await librasAdapter.setMode(mode);
    if (switched.status !== 'accepted') {
      announce(switched.message, 'error');
      return;
    }
    const opened = await librasAdapter.open();
    announce(
      opened.status === 'accepted'
        ? `Pronto. Selecione um texto na página para a ${rotulo}.`
        : opened.message,
      opened.status === 'accepted' ? 'neutral' : 'error',
    );
  };

  const handleCard = (id: CardId) => {
    if (id === 'libras') { void startRybena('libras'); return; }
    if (id === 'voice') { void startRybena('voz'); return; }
    openSurface(id);
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
    // Glossário e simplificação revisada vêm antes de qualquer rede: são
    // determinísticos, respondem na hora e não gastam cota. A explicação por IA
    // ainda não passou em avaliação semântica, então ela é o caminho de exceção.
    explainTerm: async (term: string) => {
      const known = explainFromGlossary(term);
      if (known) return { text: known.explanation, source: 'local' as const };
      const contexto = targets[0];
      if (!contexto) throw new Error('Esta etapa não tem trecho público para dar contexto à explicação.');
      const response = await requestExplanation({
        contractVersion: CONTRACT_VERSION,
        requestId: createRequestId(),
        term,
        context: contexto.text,
        contentRef: contexto.id,
      });
      return { text: response.text, source: 'service' as const };
    },
    simplifyContent: async (content: { id: string; text: string }) => {
      const local = simplifyPublicContent(props.page, content.id);
      if (local) return { text: local, source: 'local' as const };
      const response = await requestSimplification({
        contractVersion: CONTRACT_VERSION,
        requestId: createRequestId(),
        text: content.text,
        contentRef: content.id,
      });
      return { text: response.text, source: 'service' as const };
    },
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
      setAnswer(receipt.actions.find((item) => item.answer)?.answer ?? null);
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
    // Caminho determinístico, antes de qualquer rede: uma pergunta de dicionário
    // cujo termo está no glossário local é respondida aqui. O roteamento da
    // intenção dependia de `/api/accessibility/plan`, então uma resposta que já
    // existia offline caía junto com a cota do provedor.
    const known = matchGlossaryQuestion(message);
    if (known) {
      setProposal(null);
      setUndoOffered(false);
      setHistory((current) => [
        ...current,
        { role: 'user' as const, content: message },
        { role: 'assistant' as const, content: known.explanation },
      ].slice(-6));
      setRequest('');
      setAnswer({ text: known.explanation, source: 'local' });
      announce(`"${known.term}" está no glossário revisado deste protótipo. Resposta local, sem uso de IA.`);
      return;
    }

    const requestId = createRequestId();
    setBusy(true);
    setProposal(null);
    setUndoOffered(false);
    setAnswer(null);
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
      // Na recusa, o escopo entra no próprio turno do assistente: a faixa de
      // status não repete mais a fala, então não havia onde anexá-lo.
      const assistantTurn = response.mode === 'unsupported'
        ? `${response.message} ${SCOPE_NOTICE}`
        : response.message;
      setHistory((current) => [...current, { role: 'user' as const, content: message }, { role: 'assistant' as const, content: assistantTurn }].slice(-6));
      setRequest('');
      // O destino — ferramentas visuais, Libras ou voz — vem das AÇÕES do plano.
      // O cliente não adivinha por texto; o executor revalida tudo de novo.
      // Sem log, a faixa de status é o único lugar onde o assistente fala — e
      // é a região viva, então continua sendo anunciada a leitor de tela.
      if (response.mode === 'propose') {
        // A explicação vive dentro do cartão de confirmação, que é região viva:
        // repeti-la na faixa mostraria o mesmo texto duas vezes.
        setProposal(response);
        announce('');
      } else if (response.mode === 'apply') {
        // Aqui quem fala é o recibo da execução: ele diz o que de fato mudou.
        await execute(response);
      } else {
        // `clarify` pergunta, `unsupported` recusa. Nenhum dos dois aplica nada.
        announce(assistantTurn, response.mode === 'unsupported' ? 'warning' : 'neutral');
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

  const playerNote = (mode: 'libras' | 'voz') => {
    if (librasSimulated) return 'Simulação';
    if (player.state === 'loading') return 'Abrindo…';
    if (player.mode !== mode) return undefined;
    if (player.state === 'translating') return mode === 'voz' ? 'Narrando' : 'Traduzindo';
    if (player.state === 'ready' || player.state === 'paused') return 'Aberta';
    return undefined;
  };

  const cards: readonly FeatureCard<CardId>[] = [
    {
      id: 'libras',
      label: 'Libras',
      description: 'Abre a tradução em Libras da Rybená. A seleção do texto acontece na interface dela.',
      icon: Languages,
      note: playerNote('libras'),
    },
    {
      id: 'voice',
      label: 'Voz',
      description: 'Abre a narração em voz da Rybená. A seleção do texto acontece na interface dela.',
      icon: Volume2,
      note: playerNote('voz'),
    },
    { id: 'settings', label: 'Ajustes visuais', description: 'Contraste, tamanho do texto, cores, espaçamento, guia e máscara.', icon: SlidersHorizontal },
    { id: 'about', label: 'Sobre', description: 'O que este painel faz, seus limites e os créditos.', icon: Info },
  ];

  // Sugestões do chat. Só preenchem o campo: nada é enviado sem ação explícita.
  const SUGGESTIONS = ['Aumentar o texto', 'Mais contraste', 'O que é viação?'];

  return (
    <section
      className={`accessibility-panel${librasSimulated ? ' accessibility-panel--simulated' : ''}`}
      aria-label="Acessibilidade assistida por IA"
      ref={panelRef}
    >
      <div className="accessibility-panel__heading">
        <UniversalAccessIcon className="accessibility-panel__mark" />
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
            <FeatureGrid cards={cards} onOpen={handleCard} />

            {activeLabels.length > 0 ? (
              <section className="active-preferences" aria-labelledby="active-preferences-title">
                <div>
                  <h3 id="active-preferences-title">
                    <Check aria-hidden="true" />
                    {activeLabels.length} {activeLabels.length === 1 ? 'ajuste ativo nesta página' : 'ajustes ativos nesta página'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => announce(props.onReset() ? 'Aparência padrão restaurada.' : 'A aparência já está no padrão.')}
                  >
                    Remover todos
                  </button>
                </div>
                <ul className="preference-chips">
                  {activeLabels.map((label) => <li key={label}>{label}</li>)}
                </ul>
              </section>
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

            {surface === 'about' ? <AboutSurface /> : null}
          </>
        )}
      </div>

      <div className="a11y-chat">
        {/* Conversa e composer em faixas separadas: antes o formulário ficava no
            meio do diálogo, com a resposta abaixo dele, e com o texto ampliado
            ela saía da tela.

            Só a resposta mais recente. O log de conversa saiu: ele duplicava o
            que já estava visível — a página muda na frente da pessoa — e era o
            maior consumidor de altura, empurrando o campo e os botões para fora
            da tela. `history` continua em memória como contexto do planejador. */}
        <div className="a11y-chat__stream">

        {answer ? (
          <div className="a11y-chat__answer">
            <span className="a11y-chat__answer-source">
              {answer.source === 'local' ? 'Conteúdo revisado deste protótipo' : 'Gerado por IA — confira antes de usar'}
            </span>
            <p>{answer.text}</p>
          </div>
        ) : null}

        {/* Estados passageiros do sistema: "Analisando…", erros e recibos de
            execução. A explicação de uma proposta vive no próprio cartão de
            confirmação, que fica fora do fluxo com teto. */}
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

        {/* A proposta fica FORA do fluxo com teto. Dentro dele, um cartão alto —
            três ações, texto ampliado ou mensagem longa — empurrava a explicação
            para baixo do corte de 12rem, e o auto-scroll mira o painel, não este
            fluxo: a pessoa recebia o pedido de confirmação sem o motivo.
            `role="status"` porque, sem a faixa repetindo a mensagem, é aqui que
            o assistente fala. */}
        {proposal ? (
          <div className="assistant-proposal" role="status">
            <strong>Confirme antes de aplicar</strong>
            <p>{proposal.message}</p>
            <p className="assistant-proposal__hint">O planejador propôs estas ações. Nada acontece até você confirmar:</p>
            <ul>{proposal.actions.map((action, index) => <li key={`${action.type}-${index}`}>{describeAction(action)}</li>)}</ul>
            <div>
              <Button variant="quiet" onClick={() => { setProposal(null); announce('Proposta cancelada. Nada foi alterado.'); }}>Cancelar</Button>
              <Button onClick={() => void execute(proposal)}>Aplicar proposta</Button>
            </div>
          </div>
        ) : null}

        <form className="a11y-chat__form" onSubmit={askAssistant}>
          <label htmlFor="accessibility-request"><Bot aria-hidden="true" /> Fale com o assistente</label>
          {/* O escopo vive aqui, em uma linha: o chat abria mudo e a pessoa só
              descobria o limite na recusa. Os exemplos ficam nas sugestões e no
              placeholder, então repeti-los aqui só ocuparia espaço. */}
          <p className="a11y-chat__hint" id="accessibility-request-hint">
            <strong>{SCOPE_NOTICE}</strong>
          </p>
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
              aria-describedby="accessibility-request-hint"
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              maxLength={1000}
              // Duas linhas: com o texto ampliado, quatro deixavam o composer
              // mais alto que o painel inteiro. O campo continua redimensionável
              // e o conteúdo rola.
              rows={2}
              placeholder="Ex.: aumente o texto, ou: o que é embarque?"
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
                className="a11y-chat__send"
                type="submit"
                disabled={busy || request.trim().length === 0}
              >
                <Sparkles aria-hidden="true" /> {busy ? 'Analisando…' : 'Enviar'}
              </button>
            </div>
          </div>
          {voice.active ? (
            // `role="status"` porque quem usa leitor de tela nao era avisado de
            // que a escuta comecou: o indicador era um paragrafo mudo.
            <p className="voice-active" role="status">Ouvindo. Pode falar com pausas — a escuta continua.</p>
          ) : null}
          {voice.transcript ? (
            <div className="a11y-chat__voice">
              {/* O transcript nunca aparecia na tela: a pessoa falava, nao via
                  nada, e so descobria o que foi captado depois de inserir. */}
              <p className="a11y-chat__voice-preview">{voice.transcript}</p>
              <Button
                variant="secondary"
                onClick={() => {
                  // Acrescenta em vez de substituir: substituir apagava sem
                  // aviso o que a pessoa ja tinha digitado.
                  const merged = request.trim() ? `${request.trim()} ${voice.transcript}` : voice.transcript;
                  setRequest(merged);
                  voice.reset();
                  announce('Transcrição inserida no campo. Revise antes de enviar.');
                }}
              >
                <Send aria-hidden="true" /> Usar transcrição
              </Button>
            </div>
          ) : null}
          {voice.error ? <p className="field-error" role="alert">{voice.error}</p> : null}
          <small>
            A IA apenas propõe ações do contrato. O executor local valida tudo antes de alterar a tela.
            {playerAvailable ? '' : ' Libras e voz estão indisponíveis neste ambiente: o assistente não vai oferecê-las.'}
          </small>
        </form>

      </div>
    </section>
  );
}
