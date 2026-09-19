import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenText, ScanText, WandSparkles } from 'lucide-react';
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
      setSimplified('');
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
      setSimplified('');
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
      setExplanation('');
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
      setExplanation('');
      setSimplified(response.text);
      setStatus('Versão simplificada gerada. O texto original foi preservado para comparação.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível simplificar o trecho.');
    } finally {
      if (requestRef.current === controller) setBusy(null);
    }
  };

  // Um fluxo só: escolha o trecho (quando há mais de um), diga o termo se
  // quiser, e peça explicar ou simplificar. Antes eram duas seções paralelas
  // com seletores repetidos, e a pessoa tinha de entender a diferença entre
  // elas antes de conseguir usar qualquer uma.
  const resultado = explanation || simplified;

  return (
    <div className="content-tools">
      <p className="content-tools__intro">
        Explique um termo que você não conhece ou peça uma versão mais simples do trecho. O texto original nunca é substituído.
      </p>

      {targets.length === 0 ? (
        <p className="content-tools__empty">Esta etapa não tem trecho público disponível para estas ferramentas.</p>
      ) : (
        <>
          {targets.length > 1 ? (
            <>
              <label className="field-label" htmlFor="content-target">Trecho desta tela</label>
              <select
                id="content-target"
                value={selected?.id ?? ''}
                onChange={(event) => { setContentRef(event.target.value); setSimplified(''); setExplanation(''); }}
              >
                {targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
              </select>
            </>
          ) : null}

          {selected ? <p className="content-original">{selected.text}</p> : null}

          <label className="field-label" htmlFor="term-to-explain">Termo que você quer entender <span>opcional</span></label>
          <div className="content-tools__term">
            <input
              id="term-to-explain"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              maxLength={120}
              placeholder="Ex.: viação"
            />
            <Button
              variant="quiet"
              aria-pressed={selectingPage}
              aria-label="Selecionar um termo direto na página"
              onClick={startPageSelection}
            >
              <ScanText aria-hidden="true" />
            </Button>
          </div>

          <div className="content-tools__actions">
            <Button fullWidth onClick={() => void explain()} disabled={busy !== null}>
              <BookOpenText aria-hidden="true" /> {busy === 'explain' ? 'Explicando…' : 'Explicar termo'}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => void simplify()} disabled={!selected || busy !== null}>
              <WandSparkles aria-hidden="true" /> {busy === 'simplify' ? 'Simplificando…' : 'Simplificar trecho'}
            </Button>
          </div>
        </>
      )}

      {status ? <p className="assistant-message content-tools__status" role="status">{status}</p> : null}

      {resultado ? (
        <div className="content-result" aria-live="polite">
          <strong>{explanation ? 'Explicação' : 'Versão simplificada'}</strong>
          <p>{resultado}</p>
        </div>
      ) : null}

      <p className="privacy-note">
        A resposta aparece separadamente e não substitui o texto da página. Nenhum dado de passageiro, pagamento, checkout ou confirmação é enviado.
      </p>
    </div>
  );
}
