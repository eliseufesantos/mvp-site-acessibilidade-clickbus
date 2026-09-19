import { Accessibility, MousePointer2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PreferencePatch } from '../../features/accessibility-agent/core/preferences';
import { getActivePreferenceLabels } from '../../features/accessibility-agent/core/preferences';
import type { AccessibilityPreferences, JourneyStep } from '../../types';
import { AccessibilityPanel } from './AccessibilityPanel';
import { focusAfterRender } from '../../utils/focus';

interface AccessibilityPluginProps {
  canUndo: boolean;
  getPreferences(): AccessibilityPreferences;
  getStateRevision(): number;
  onApplyPreferences(patch: PreferencePatch): boolean;
  onResetPreferences(): boolean;
  onUndoPreferences(): boolean;
  page: JourneyStep;
  pageEpoch: number;
  preferences: AccessibilityPreferences;
  stateRevision: number;
  storageAvailable: boolean;
}

const MOBILE_QUERY = '(max-width: 820px)';
const FOCUSABLE_SELECTOR = 'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function AccessibilityPlugin(props: AccessibilityPluginProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSelectingPage, setIsSelectingPage] = useState(false);
  const [panelSession, setPanelSession] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const wasSelectingPageRef = useRef(false);
  const activeModes = getActivePreferenceLabels(props.preferences).length;

  const closePanel = useCallback((restoreFocus = true) => {
    setIsSelectingPage(false);
    setIsPanelOpen(false);
    if (restoreFocus) focusAfterRender(() => triggerRef.current);
  }, []);

  const openPanel = useCallback(() => {
    setPanelSession((current) => current + 1);
    setIsPanelOpen(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isPanelOpen) return undefined;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isSelectingPage) return;
      event.preventDefault();
      closePanel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closePanel, isPanelOpen, isSelectingPage]);

  // O painel abre sempre na grade de recursos; o foco vai para o primeiro
  // cartao, marcado por `data-a11y-entry`.
  useEffect(() => {
    if (!isPanelOpen) return;
    focusAfterRender(() => surfaceRef.current?.querySelector<HTMLElement>('[data-a11y-entry]'));
  }, [isPanelOpen]);

  useEffect(() => {
    if (!isPanelOpen || isSelectingPage || !isMobile) return;
    const surface = surfaceRef.current;
    if (surface?.contains(document.activeElement)) return;
    focusAfterRender(() => surface?.querySelector<HTMLElement>('[data-a11y-entry]'));
  }, [isMobile, isPanelOpen, isSelectingPage]);

  useEffect(() => {
    if (!isPanelOpen) {
      wasSelectingPageRef.current = false;
      return;
    }
    if (isSelectingPage) {
      wasSelectingPageRef.current = true;
      focusAfterRender(() => document.getElementById('main-content'), { preventScroll: true });
      return;
    }
    if (wasSelectingPageRef.current) {
      wasSelectingPageRef.current = false;
      focusAfterRender(() => document.getElementById('term-to-explain'), { preventScroll: true });
    }
  }, [isPanelOpen, isSelectingPage]);

  useEffect(() => {
    if (!isPanelOpen || isSelectingPage) return undefined;
    const previousOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = 'hidden';

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !isMobile) return;
      const surface = surfaceRef.current;
      const focusable = Array.from(surface?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!surface?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', trapFocus);
    return () => {
      document.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, isPanelOpen, isSelectingPage]);

  useEffect(() => {
    if (isPanelOpen) closePanel(false);
    // A troca de etapa invalida planos pendentes e desmonta o painel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.pageEpoch]);

  const handleSelectionModeChange = useCallback((active: boolean) => {
    setIsSelectingPage(active);
  }, []);

  const triggerLabel = `${isSelectingPage ? 'Cancelar seleção e fechar' : isPanelOpen ? 'Fechar' : 'Abrir'} acessibilidade${activeModes > 0 ? `, ${activeModes} ${activeModes === 1 ? 'ajuste ativo' : 'ajustes ativos'}` : ''}`;

  return (
    <aside className={`accessibility-plugin${isPanelOpen ? ' accessibility-plugin--open' : ''}${isSelectingPage ? ' accessibility-plugin--selecting' : ''}`} aria-label="Recursos de acessibilidade">
      <button
        className="accessibility-plugin__trigger accessibility-trigger"
        type="button"
        aria-label={triggerLabel}
        aria-expanded={isPanelOpen}
        aria-controls="accessibility-panel"
        ref={triggerRef}
        onClick={() => (isPanelOpen ? closePanel() : openPanel())}
      >
        <Accessibility className="accessibility-plugin__trigger-icon" aria-hidden="true" />
        {activeModes > 0 ? <span className="mode-count" aria-hidden="true">{activeModes}</span> : null}
      </button>

      {isPanelOpen ? (
        <>
          {isMobile && !isSelectingPage ? <div className="accessibility-plugin__backdrop" aria-hidden="true" onPointerDown={() => closePanel()} /> : null}
          {isSelectingPage ? (
            <div className="accessibility-plugin__selection-coach" role="status">
              <MousePointer2 aria-hidden="true" />
              <div><strong>Selecione um texto na página</strong><span>Arraste sobre um trecho identificado. Pressione Esc para cancelar.</span></div>
            </div>
          ) : null}
          <div
            id="accessibility-panel"
            className="accessibility-plugin__surface accessibility-menu__popover"
            role={isMobile ? 'dialog' : 'region'}
            aria-modal={isMobile && !isSelectingPage ? true : undefined}
            aria-hidden={isSelectingPage ? true : undefined}
            aria-label="Painel de acessibilidade"
            ref={surfaceRef}
          >
            <AccessibilityPanel
              canUndo={props.canUndo}
              getPreferences={props.getPreferences}
              getStateRevision={props.getStateRevision}
              preferences={props.preferences}
              stateRevision={props.stateRevision}
              storageAvailable={props.storageAvailable}
              page={props.page}
              pageEpoch={props.pageEpoch}
              panelSession={panelSession}
              onApply={props.onApplyPreferences}
              onClose={closePanel}
              onSelectionModeChange={handleSelectionModeChange}
              onReset={props.onResetPreferences}
              onUndo={props.onUndoPreferences}
            />
          </div>
        </>
      ) : null}
    </aside>
  );
}
