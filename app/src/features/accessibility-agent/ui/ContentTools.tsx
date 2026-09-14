import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenText, Languages, WandSparkles } from 'lucide-react';
import type { JourneyStep } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { getApprovedPageSelection, getPublicContentTargets, resolvePublicContent } from '../adapters/clickbus/content';
import { rybenaAdapter } from '../adapters/libras/rybenaUnavailable';
import { CONTRACT_VERSION } from '../core/contracts';
import { explainFromGlossary } from '../core/glossary';
import { createRequestId, requestExplanation, requestSimplification } from '../core/plannerClient';

interface ContentToolsProps {
  page: JourneyStep;
}

export function ContentTools({ page }: ContentToolsProps) {
  const targets = useMemo(() => getPublicContentTargets(page), [page]);
  const [contentRef, setContentRef] = useState(targets[0]?.id ?? '');
  const [term, setTerm] = useState('');
  const [explanation, setExplanation] = useState('');
  const [simplified, setSimplified] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState<'explain' | 'simplify' | null>(null);
  const requestRef = useRef<AbortController | null>(null);
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

  const useSelection = () => {
    const selection = getApprovedPageSelection(page);
    if (!selection) {
      setStatus('Selecione de 2 a 120 caracteres dentro de um trecho público identificado desta tela.');
      return;
    }
    setTerm(selection.term);
    setContentRef(selection.contentRef);
    setStatus('Seleção copiada. Revise o termo antes de pedir a explicação.');
  };

  const simplify = async () => {
    if (!selected?.allowSimplify) {
      setStatus('Esta etapa não oferece conteúdo público autorizado para simplificação.');
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
      <section className="a11y-section" aria-labelledby="explain-title">
        <div className="a11y-section__heading"><h3 id="explain-title"><BookOpenText aria-hidden="true" /> Explicar termo</h3><span>Não executa ajustes</span></div>
        <p>Termos conhecidos são explicados localmente. Outros termos só usam o trecho público escolhido.</p>
        <label className="field-label" htmlFor="term-to-explain">Termo ou expressão</label>
        <input id="term-to-explain" value={term} onChange={(event) => setTerm(event.target.value)} maxLength={120} placeholder="Ex.: viação" />
        <div className="content-tools__actions">
          <Button variant="quiet" onClick={useSelection}>Usar seleção da página</Button>
          <Button onClick={() => void explain()} disabled={busy !== null}>{busy === 'explain' ? 'Explicando…' : 'Explicar'}</Button>
        </div>
        {explanation ? <div className="content-result" aria-live="polite"><strong>Explicação</strong><p>{explanation}</p></div> : null}
      </section>

      <section className="a11y-section" aria-labelledby="simplify-title">
        <div className="a11y-section__heading"><h3 id="simplify-title"><WandSparkles aria-hidden="true" /> Simplificar trecho</h3><span>Original preservado</span></div>
        <label className="field-label" htmlFor="content-to-simplify">Trecho público desta tela</label>
        <select id="content-to-simplify" value={selected?.id ?? ''} onChange={(event) => { setContentRef(event.target.value); setSimplified(''); }} disabled={targets.length === 0}>
          {targets.length === 0 ? <option value="">Nenhum trecho disponível</option> : targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
        </select>
        {selected ? <div className="content-original"><strong>Texto original</strong><p>{selected.text}</p></div> : <p>Conteúdo de checkout e confirmação não é exposto a esta ferramenta.</p>}
        <Button variant="secondary" fullWidth onClick={() => void simplify()} disabled={!selected || busy !== null}>{busy === 'simplify' ? 'Simplificando…' : 'Criar versão mais simples'}</Button>
        {simplified ? <div className="content-result" aria-live="polite"><strong>Versão simplificada</strong><p>{simplified}</p></div> : null}
      </section>

      <section className="rybena-unavailable" aria-labelledby="libras-title">
        <Languages aria-hidden="true" />
        <div><h3 id="libras-title">Tradução em Libras</h3><p>{libras.message}</p><a href={libras.attributionUrl} target="_blank" rel="noreferrer">{libras.attribution}</a></div>
      </section>
      {status ? <p className="assistant-message" role="status">{status}</p> : null}
      <p className="privacy-note">Nenhum dado de passageiro, pagamento, checkout ou confirmação é enviado por estas ferramentas.</p>
    </div>
  );
}
