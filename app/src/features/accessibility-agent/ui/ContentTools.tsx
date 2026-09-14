import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenText, Languages, ScanText, WandSparkles } from 'lucide-react';
import type { JourneyStep } from '../../../types';
import { Button } from '../../../components/ui/Button';
import {
  clearRememberedApprovedPageSelection,
  getApprovedPageSelection,
  getPublicContentTargets,
  rememberApprovedPageSelection,
  resolvePublicContent,
  simplifyPublicContent,
} from '../adapters/clickbus/content';
import { rybenaAdapter } from '../adapters/libras/rybenaUnavailable';
import { CONTRACT_VERSION } from '../core/contracts';
import { explainFromGlossary } from '../core/glossary';
import { createRequestId, requestExplanation, requestSimplification } from '../core/plannerClient';

interface ContentToolsProps {
  onSelectionModeChange?(active: boolean): void;
  page: JourneyStep;
}

export function ContentTools({ onSelectionModeChange, page }: ContentToolsProps) {
  const targets = useMemo(() => getPublicContentTargets(page), [page]);
  const [contentRef, setContentRef] = useState(targets[0]?.id ?? '');
  const [term, setTerm] = useState('');
  const [explanation, setExplanation] = useState('');
  const [simplified, setSimplified] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState<'explain' | 'simplify' | null>(null);
  const [selectingPage, setSelectingPage] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const selectionModeRef = useRef(false);
  const selectionModeCallbackRef = useRef(onSelectionModeChange);
  const selected = resolvePublicContent(page, contentRef) ?? targets[0] ?? null;
  const libras = rybenaAdapter.getSnapshot();

  useEffect(() => {
    setContentRef(targets[0]?.id ?? '');
    setExplanation('');
    setSimplified('');
    setStatus('');
    requestRef.current?.abort();
  }, [page, targets]);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    selectionModeCallbackRef.current = onSelectionModeChange;
  }, [onSelectionModeChange]);

  useEffect(() => () => {
    if (selectionModeRef.current) selectionModeCallbackRef.current?.(false);
  }, []);

  useEffect(() => {
    clearRememberedApprovedPageSelection();
    rememberApprovedPageSelection(page);
    const captureSelection = () => {
      rememberApprovedPageSelection(page);
    };
    document.addEventListener('selectionchange', captureSelection);
    return () => document.removeEventListener('selectionchange', captureSelection);
  }, [page]);

  useEffect(() => {
    if (!selectingPage) return undefined;
    let frame = 0;
    let selectionTimer = 0;
    let finishQueued = false;
    const leaveSelectionMode = (message: string) => {
      selectionModeRef.current = false;
      setSelectingPage(false);
      selectionModeCallbackRef.current?.(false);
      setStatus(message);
    };
    const finishSelection = () => {
      if (finishQueued) return;
      finishQueued = true;
      frame = window.requestAnimationFrame(() => {
        const selection = getApprovedPageSelection(page);
        if (!selection) {
          finishQueued = false;
          return;
        }
        setTerm(selection.term);
        setContentRef(selection.contentRef);
        leaveSelectionMode('Seleção copiada. Revise o termo antes de pedir a explicação.');
      });
    };
    const cancelSelection = (event: KeyboardEvent) => {
      if (event.key === 'Escape') leaveSelectionMode('Seleção da página cancelada.');
    };
    const scheduleSelectionFallback = () => {
      window.clearTimeout(selectionTimer);
      selectionTimer = window.setTimeout(() => {
        if (getApprovedPageSelection(page)) finishSelection();
      }, 400);
    };
    document.addEventListener('pointerup', finishSelection, { capture: true });
    document.addEventListener('mouseup', finishSelection, { capture: true });
    document.addEventListener('touchend', finishSelection, { capture: true });
    document.addEventListener('selectionchange', scheduleSelectionFallback);
    document.addEventListener('keydown', cancelSelection);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(selectionTimer);
      document.removeEventListener('pointerup', finishSelection, { capture: true });
      document.removeEventListener('mouseup', finishSelection, { capture: true });
      document.removeEventListener('touchend', finishSelection, { capture: true });
      document.removeEventListener('selectionchange', scheduleSelectionFallback);
      document.removeEventListener('keydown', cancelSelection);
    };
  }, [page, selectingPage]);

  const beginRequest = (kind: 'explain' | 'simplify') => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(kind);
    setStatus('');
    return controller;
  };

  const explain = async () => {
    const cleanTerm = term.trim();
    if (!cleanTerm) {
      setStatus('Digite um termo ou selecione uma palavra em um trecho autorizado da página.');
      return;
    }
    const known = explainFromGlossary(cleanTerm);
    if (known) {
      setExplanation(known.explanation);
      setStatus('Explicação encontrada no glossário local da viagem.');
      return;
    }
    if (!selected) {
      setStatus('Esta etapa não oferece trecho público para enviar ao serviço de explicação.');
      return;
    }
    const controller = beginRequest('explain');
    const requestId = createRequestId();
    try {
      const response = await requestExplanation({
        contractVersion: CONTRACT_VERSION,
        requestId,
        term: cleanTerm,
        context: selected.text,
        contentRef: selected.id,
      }, controller.signal);
      setExplanation(response.text);
      setStatus('Explicação gerada para o termo escolhido. Confira o contexto antes de usar.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível explicar o termo.');
    } finally {
      if (requestRef.current === controller) setBusy(null);
    }
  };

  const startPageSelection = () => {
    if (targets.length === 0) {
      setStatus('Esta etapa não possui um trecho público disponível para seleção.');
      return;
    }
    clearRememberedApprovedPageSelection();
    window.getSelection()?.removeAllRanges();
    selectionModeRef.current = true;
    setSelectingPage(true);
    setStatus('Selecione de 2 a 120 caracteres em um trecho público da página.');
    selectionModeCallbackRef.current?.(true);
  };

  const simplify = async () => {
    if (!selected?.allowSimplify) {
      setStatus('Esta etapa não oferece conteúdo público autorizado para simplificação.');
      return;
    }
    const localSimplification = simplifyPublicContent(page, selected.id);
    if (localSimplification) {
      setSimplified(localSimplification);
      setStatus('Versão simples revisada localmente. O texto original foi preservado para comparação.');
      return;
    }
    const controller = beginRequest('simplify');
    const requestId = createRequestId();
    setSimplified('');
    try {
      const response = await requestSimplification({
        contractVersion: CONTRACT_VERSION,
        requestId,
        text: selected.text,
        contentRef: selected.id,
      }, controller.signal);
      setSimplified(response.text);
      setStatus('Versão simplificada gerada. O texto original foi preservado para comparação.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível simplificar o trecho.');
    } finally {
      if (requestRef.current === controller) setBusy(null);
    }
  };

  return (
    <div className="content-tools">
      <header className="content-tools__intro">
        <h3>Entenda qualquer trecho</h3>
        <p>Selecione um texto na página para explicar ou simplificar.</p>
      </header>
      {status ? <p className="assistant-message content-tools__status" role="status">{status}</p> : null}

      <section className="a11y-section" aria-labelledby="explain-title">
        <div className="a11y-section__heading"><h3 id="explain-title"><BookOpenText aria-hidden="true" /> Explicar termo</h3><span>Não executa ajustes</span></div>
        <p>Termos conhecidos são explicados localmente. Outros termos só usam o trecho público escolhido.</p>
        <Button className="page-selection-button" variant="quiet" aria-pressed={selectingPage} onClick={startPageSelection} disabled={targets.length === 0}>
          <ScanText aria-hidden="true" />
          <span><strong>{selectingPage ? 'Selecione o termo…' : 'Selecionar na página'}</strong><small>{targets.length > 0 ? 'Arraste sobre um trecho identificado desta tela' : 'Nenhum trecho público disponível nesta etapa'}</small></span>
        </Button>
        <label className="field-label" htmlFor="term-to-explain">Termo ou expressão</label>
        <input id="term-to-explain" value={term} onChange={(event) => setTerm(event.target.value)} maxLength={120} placeholder="Ex.: viação" />
        <Button className="content-primary-action" fullWidth onClick={() => void explain()} disabled={busy !== null}>{busy === 'explain' ? 'Explicando…' : 'Explicar termo'}</Button>
        {explanation ? <div className="content-result" aria-live="polite"><strong>Explicação</strong><p>{explanation}</p></div> : null}
      </section>

      <section className="a11y-section" aria-labelledby="simplify-title">
        <div className="a11y-section__heading"><h3 id="simplify-title"><WandSparkles aria-hidden="true" /> Simplificar trecho</h3><span>Original preservado</span></div>
        <label className="field-label" htmlFor="content-to-simplify">Trecho público desta tela</label>
        <select id="content-to-simplify" value={selected?.id ?? ''} onChange={(event) => { setContentRef(event.target.value); setSimplified(''); }} disabled={targets.length === 0}>
          {targets.length === 0 ? <option value="">Nenhum trecho disponível</option> : targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
        </select>
        {selected ? <div className="content-original"><strong>Texto original</strong><p>{selected.text}</p></div> : <p>Conteúdo de checkout e confirmação não é exposto a esta ferramenta.</p>}
        <Button variant="secondary" fullWidth onClick={() => void simplify()} disabled={!selected || busy !== null}>{busy === 'simplify' ? 'Simplificando…' : 'Simplificar trecho'}</Button>
        {simplified ? <div className="content-result" aria-live="polite"><strong>Versão simplificada</strong><p>{simplified}</p></div> : null}
      </section>

      <section className="rybena-unavailable" aria-labelledby="libras-title">
        <Languages aria-hidden="true" />
        <div><h3 id="libras-title">Tradução em Libras</h3><p>{libras.message}</p><a href={libras.attributionUrl} target="_blank" rel="noreferrer">{libras.attribution}</a></div>
      </section>
      <p className="privacy-note">As explicações aparecem separadamente e não substituem o texto original. Nenhum dado de passageiro, pagamento, checkout ou confirmação é enviado.</p>
    </div>
  );
}
