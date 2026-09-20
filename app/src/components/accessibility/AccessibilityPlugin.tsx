import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PreferencePatch } from '../../features/accessibility-agent/core/preferences';
import { getActivePreferenceLabels } from '../../features/accessibility-agent/core/preferences';
import type { AccessibilityPreferences, JourneyStep } from '../../types';
import { AccessibilityPanel } from './AccessibilityPanel';
import { ACCESSIBILITY_SLOT_ID } from '../layout/Header';
import { UniversalAccessIcon } from './UniversalAccessIcon';
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
  const [panelSession, setPanelSession] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const activeModes = getActivePreferenceLabels(props.preferences).length;

  const closePanel = useCallback((restoreFocus = true) => {
    setIsPanelOpen(false);
    if (restoreFocus) focusAfterRender(() => triggerRef.current);
  }, []);

  const openPanel = useCallback(() => {
    setPanelSession((current) => current + 1);
    setIsPanelOpen(true);
  }, []);

  // `useLayoutEffect` para o acionador já nascer no header, sem um quadro no
  // lugar de reserva. Se o encaixe faltar, ele ainda é renderizado no host:
  // o controle de acessibilidade nunca pode simplesmente sumir.
  useLayoutEffect(() => {
    setHeaderSlot(document.getElementById(ACCESSIBILITY_SLOT_ID));
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
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closePanel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closePanel, isPanelOpen]);

  // O painel abre sempre na grade de recursos; o foco vai para o primeiro
  // cartao, marcado por `data-a11y-entry`.
  useEffect(() => {
    if (!isPanelOpen) return;
    focusAfterRender(() => surfaceRef.current?.querySelector<HTMLElement>('[data-a11y-entry]'));
  }, [isPanelOpen]);

  useEffect(() => {
    if (!isPanelOpen || !isMobile) return;
    const surface = surfaceRef.current;
    if (surface?.contains(document.activeElement)) return;
    focusAfterRender(() => surface?.querySelector<HTMLElement>('[data-a11y-entry]'));
  }, [isMobile, isPanelOpen]);

  useEffect(() => {
    if (!isPanelOpen) return undefined;
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
  }, [isMobile, isPanelOpen]);

  const triggerLabel = `${isPanelOpen ? 'Fechar' : 'Abrir'} acessibilidade${activeModes > 0 ? `, ${activeModes} ${activeModes === 1 ? 'ajuste ativo' : 'ajustes ativos'}` : ''}`;

  const trigger = (
    <button
      className="accessibility-plugin__trigger accessibility-trigger"
      type="button"
      aria-label={triggerLabel}
      aria-expanded={isPanelOpen}
      aria-controls="accessibility-panel"
      ref={triggerRef}
      onClick={() => (isPanelOpen ? closePanel() : openPanel())}
    >
      <span className="accessibility-plugin__trigger-text" aria-hidden="true">Acessibilidade</span>
      <span className="accessibility-plugin__trigger-badge">
        <UniversalAccessIcon className="accessibility-plugin__trigger-icon" />
        {activeModes > 0 ? <span className="mode-count" aria-hidden="true">{activeModes}</span> : null}
      </span>
    </button>
  );

  return (
    <aside className={`accessibility-plugin${isPanelOpen ? ' accessibility-plugin--open' : ''}`} aria-label="Recursos de acessibilidade">
      {headerSlot ? createPortal(trigger, headerSlot) : trigger}

      {isPanelOpen ? (
        <>
          {isMobile ? <div className="accessibility-plugin__backdrop" aria-hidden="true" onPointerDown={() => closePanel()} /> : null}
          <div
            id="accessibility-panel"
            className="accessibility-plugin__surface accessibility-menu__popover"
            role={isMobile ? 'dialog' : 'region'}
            aria-modal={isMobile ? true : undefined}
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
              onReset={props.onResetPreferences}
              onUndo={props.onUndoPreferences}
            />
          </div>
        </>
      ) : null}
    </aside>
  );
}
