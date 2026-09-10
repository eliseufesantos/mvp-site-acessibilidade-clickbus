import { useEffect, useRef, useState } from 'react';
import { Bot, BookOpenText, Check, MessageCircle, Mic, Send, ShieldCheck, SlidersHorizontal, Sparkles, Square, X } from 'lucide-react';
import type { AccessibilityPreferences, JourneyStep } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { getPublicContentTargets, resolvePublicContent } from '../adapters/clickbus/content';
import { rybenaAdapter } from '../adapters/libras/rybenaUnavailable';
import {
  ALL_ACTION_TYPES,
  CONTRACT_VERSION,
  type ActionType,
  type PlanAction,
  type PlannerResponse,
} from '../core/contracts';
import { AccessibilityExecutor, formatExecutionReceipt } from '../core/executor';
import { createRequestId, requestPlan } from '../core/plannerClient';
import { getActivePreferenceLabels, type PreferencePatch } from '../core/preferences';
import { ContentTools } from './ContentTools';
import { PreferenceControls } from './PreferenceControls';
import { useVoiceInput } from './useVoiceInput';

type PanelTab = 'conversation' | 'settings' | 'content';

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

const visualCapabilities = ALL_ACTION_TYPES.filter((type): type is ActionType => [
  'set_preferences', 'apply_comfortable_reading', 'undo_preferences', 'reset_preferences',
].includes(type));

const describeAction = (action: PlanAction) => {
  if (action.type === 'set_preferences') return 'Alterar as preferências indicadas';
  if (action.type === 'apply_comfortable_reading') return 'Aplicar o conjunto Leitura confortável';
  if (action.type === 'undo_preferences') return 'Desfazer o último ajuste';
  if (action.type === 'reset_preferences') return 'Restaurar a aparência padrão';
  return 'Solicitar um recurso de Libras';
};

export function AccessibilityPanel(props: AccessibilityPanelProps) {
  const [tab, setTab] = useState<PanelTab>('conversation');
  const [request, setRequest] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<PlannerResponse | null>(null);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const executorRef = useRef(new AccessibilityExecutor());
  const requestControllerRef = useRef<AbortController | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const voice = useVoiceInput();
  const activeLabels = getActivePreferenceLabels(props.preferences);
  const targets = getPublicContentTargets(props.page);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  useEffect(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setBusy(false);
  }, [props.stateRevision]);

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
    libras: rybenaAdapter,
    capabilities: visualCapabilities,
  });

  const execute = async (plan: PlannerResponse) => {
    try {
      const receipt = await executorRef.current.execute(plan, dependencies(plan.requestId));
      setStatus(formatExecutionReceipt(receipt) || plan.message);
      setProposal(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'O plano não pôde ser aplicado.');
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
    setStatus('Analisando seu pedido com o planejador seguro…');
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
          librasState: rybenaAdapter.getSnapshot().state,
          preferences: props.getPreferences(),
          capabilities: visualCapabilities,
          contentTargets: targets.map(({ id, label }) => ({ id, label })),
        },
        history: history.slice(-6),
      }, controller.signal);
      setHistory((current) => [...current, { role: 'user' as const, content: message }, { role: 'assistant' as const, content: response.message }].slice(-6));
      setRequest('');
      if (response.mode === 'propose') {
        setProposal(response);
        setStatus(response.message);
      } else if (response.mode === 'apply') {
        await execute(response);
      } else {
        setStatus(response.message);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'O assistente não conseguiu responder.');
    } finally {
      if (requestControllerRef.current === controller) setBusy(false);
    }
  };

  const tabs: { id: PanelTab; label: string; icon: typeof MessageCircle }[] = [
    { id: 'conversation', label: 'Conversa', icon: MessageCircle },
    { id: 'settings', label: 'Ajustes', icon: SlidersHorizontal },
    { id: 'content', label: 'Conteúdo', icon: BookOpenText },
  ];

  const selectTab = (nextTab: PanelTab) => {
    setTab(nextTab);
    window.requestAnimationFrame(() => panelRef.current?.scrollTo({ top: 0, behavior: 'auto' }));
  };

  return (
    <section className="accessibility-panel" aria-label="Acessibilidade assistida por IA" ref={panelRef}>
      <div className="accessibility-panel__heading">
        <ShieldCheck aria-hidden="true" size={22} />
        <div><h2>Acessibilidade</h2><p>Ajustes locais, reversíveis e sob seu controle.</p></div>
        <button className="panel-close" type="button" aria-label="Fechar acessibilidade" onClick={props.onClose}><X aria-hidden="true" /></button>
      </div>

      <div className="a11y-tabs" role="tablist" aria-label="Áreas de acessibilidade">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} id={`a11y-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`a11y-panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => selectTab(id)}><Icon aria-hidden="true" />{label}</button>)}
      </div>

      {tab === 'conversation' ? (
        <div id="a11y-panel-conversation" role="tabpanel" aria-labelledby="a11y-tab-conversation" className="a11y-tab-panel">
          <div className="active-preferences">
            <div><strong>Agora na página</strong><span>Revisão {props.stateRevision}</span></div>
            {activeLabels.length > 0 ? <div className="preference-chips">{activeLabels.map((label) => <span key={label}><Check aria-hidden="true" />{label}</span>)}</div> : <p>Nenhum ajuste visual adicional está ativo.</p>}
          </div>
          <form className="accessibility-assistant" onSubmit={askAssistant}>
            <label htmlFor="accessibility-request"><Bot aria-hidden="true" /> Peça uma adaptação</label>
            <textarea id="accessibility-request" value={request} onChange={(event) => setRequest(event.target.value)} maxLength={1000} rows={3} placeholder="Ex.: aumente o texto e reduza o movimento" />
            <div className="assistant-composer__actions">
              <Button type="submit" disabled={busy || request.trim().length === 0}><Sparkles aria-hidden="true" /> {busy ? 'Analisando…' : 'Planejar ajuste'}</Button>
            </div>
            <small>A IA apenas propõe ações do contrato. O executor local valida tudo antes de alterar a tela.</small>
          </form>

          <div className="voice-input">
            <div className="voice-input__heading"><strong>Entrada por voz (opcional)</strong>{voice.active ? <span className="voice-active">Microfone ativo</span> : null}</div>
            <p>O reconhecimento do navegador pode processar áudio remotamente. Nada é enviado sem você iniciar.</p>
            {voice.supported ? <div className="voice-input__actions"><Button variant="quiet" onClick={voice.active ? voice.stop : voice.start}>{voice.active ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}{voice.active ? 'Parar captura' : 'Iniciar captura'}</Button></div> : <p>Reconhecimento de voz não disponível neste navegador.</p>}
            {voice.transcript || voice.active ? <><label className="field-label" htmlFor="voice-transcript">Transcrição editável</label><textarea id="voice-transcript" value={voice.transcript} onChange={(event) => voice.setTranscript(event.target.value)} rows={2} /><Button variant="secondary" onClick={() => { setRequest(voice.transcript); setStatus('Transcrição copiada. Revise antes de enviar.'); }} disabled={!voice.transcript.trim()}><Send aria-hidden="true" /> Usar transcrição</Button></> : null}
            {voice.error ? <p className="field-error" role="alert">{voice.error}</p> : null}
          </div>

          {proposal ? <div className="assistant-proposal"><strong>Confirme antes de aplicar</strong><p>{proposal.message}</p><ul>{proposal.actions.map((action, index) => <li key={`${action.type}-${index}`}>{describeAction(action)}</li>)}</ul><div><Button variant="quiet" onClick={() => { setProposal(null); setStatus('Proposta cancelada.'); }}>Cancelar</Button><Button onClick={() => void execute(proposal)}>Aplicar proposta</Button></div></div> : null}
          {status ? <p className="assistant-message" role="status">{status}</p> : null}
          {!props.storageAvailable ? <p className="storage-warning" role="status">As preferências funcionam nesta sessão, mas este navegador bloqueou o salvamento local.</p> : null}
          <button className="text-link" type="button" onClick={() => selectTab('settings')}>Prefere escolher manualmente? Abrir todos os ajustes.</button>
        </div>
      ) : null}

      {tab === 'settings' ? <div id="a11y-panel-settings" role="tabpanel" aria-labelledby="a11y-tab-settings" className="a11y-tab-panel"><PreferenceControls canUndo={props.canUndo} preferences={props.preferences} onApply={props.onApply} onReset={props.onReset} onUndo={props.onUndo} onStatus={setStatus} />{status ? <p className="assistant-message" role="status">{status}</p> : null}</div> : null}
      {tab === 'content' ? <div id="a11y-panel-content" role="tabpanel" aria-labelledby="a11y-tab-content" className="a11y-tab-panel"><ContentTools page={props.page} /></div> : null}
    </section>
  );
}
