import { useEffect, useRef, useState } from 'react';
import type { JourneyStep } from '../../../types';
import {
  clearRememberedApprovedPageSelection,
  getApprovedPageSelection,
  getPublicContentTargets,
  rememberApprovedPageSelection,
} from '../adapters/clickbus/content';

interface PageSelectionOptions {
  page: JourneyStep;
  /** Recebe o termo selecionado. A captura fica restrita a alvos públicos. */
  onSelected(term: string): void;
  onStatus(message: string): void;
  onModeChange?(active: boolean): void;
}

/**
 * Modo de seleção de texto na página.
 *
 * Extraído da antiga superfície de Conteúdo para que o chat possa usá-lo: a
 * seleção é a única coisa que digitar não resolve, porque exige apontar para um
 * trecho. A captura continua restrita aos alvos públicos registrados, que é o
 * que mantém checkout e dados de passageiro fora das ferramentas de conteúdo.
 */
export const usePageSelection = ({ page, onSelected, onStatus, onModeChange }: PageSelectionOptions) => {
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  const callbacks = useRef({ onSelected, onStatus, onModeChange });
  const targets = getPublicContentTargets(page);

  useEffect(() => {
    callbacks.current = { onSelected, onStatus, onModeChange };
  }, [onSelected, onStatus, onModeChange]);

  useEffect(() => () => {
    if (activeRef.current) callbacks.current.onModeChange?.(false);
  }, []);

  useEffect(() => {
    clearRememberedApprovedPageSelection();
    rememberApprovedPageSelection(page);
    const capture = () => rememberApprovedPageSelection(page);
    document.addEventListener('selectionchange', capture);
    return () => document.removeEventListener('selectionchange', capture);
  }, [page]);

  useEffect(() => {
    if (!active) return undefined;
    let frame = 0;
    let fallback = 0;
    let queued = false;

    const leave = (message: string) => {
      activeRef.current = false;
      setActive(false);
      delete document.documentElement.dataset.a11ySelecting;
      callbacks.current.onModeChange?.(false);
      callbacks.current.onStatus(message);
    };

    const finish = () => {
      if (queued) return;
      queued = true;
      frame = window.requestAnimationFrame(() => {
        const selection = getApprovedPageSelection(page);
        if (!selection) {
          queued = false;
          // Uma seleção real fora de um trecho identificado não pode falhar em
          // silêncio. Antes a faixa seguia repetindo a regra de 2 a 120
          // caracteres, culpando o tamanho quando o problema era o elemento:
          // selecionar 22 caracteres válidos num título era recusado sem que
          // nada na tela explicasse por quê.
          const raw = window.getSelection()?.toString().replace(/\s+/g, ' ').trim() ?? '';
          if (raw) {
            callbacks.current.onStatus(
              raw.length < 2 || raw.length > 120
                ? 'Selecione entre 2 e 120 caracteres.'
                : 'Este trecho não está disponível para o assistente. Escolha um dos textos de ajuda destacados na página.',
            );
          }
          return;
        }
        callbacks.current.onSelected(selection.term);
        leave(`"${selection.term}" copiado para o pedido. Revise antes de enviar.`);
      });
    };

    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') leave('Seleção da página cancelada.');
    };

    const scheduleFallback = () => {
      window.clearTimeout(fallback);
      fallback = window.setTimeout(() => {
        if (getApprovedPageSelection(page)) finish();
      }, 400);
    };

    document.addEventListener('pointerup', finish, { capture: true });
    document.addEventListener('mouseup', finish, { capture: true });
    document.addEventListener('touchend', finish, { capture: true });
    document.addEventListener('selectionchange', scheduleFallback);
    document.addEventListener('keydown', cancel);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
      document.removeEventListener('pointerup', finish, { capture: true });
      document.removeEventListener('mouseup', finish, { capture: true });
      document.removeEventListener('touchend', finish, { capture: true });
      document.removeEventListener('selectionchange', scheduleFallback);
      document.removeEventListener('keydown', cancel);
    };
  }, [active, page]);

  const start = () => {
    if (targets.length === 0) {
      callbacks.current.onStatus('Esta etapa não tem trecho público disponível para seleção.');
      return;
    }
    clearRememberedApprovedPageSelection();
    window.getSelection()?.removeAllRanges();
    activeRef.current = true;
    setActive(true);
    // Durante a seleção, os trechos elegíveis ganham destaque. Sem isso nada na
    // página indicava o que podia ser selecionado, e a pessoa descobria o
    // limite só depois de a seleção ser recusada.
    document.documentElement.dataset.a11ySelecting = 'true';
    callbacks.current.onStatus('Arraste sobre um dos textos de ajuda destacados. Eles são os trechos que o assistente pode usar.');
    callbacks.current.onModeChange?.(true);
  };

  return { active, start, available: targets.length > 0 };
};
