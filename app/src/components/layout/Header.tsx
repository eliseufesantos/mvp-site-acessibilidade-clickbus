import { Accessibility, ChevronDown, CircleHelp, Tag } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getActivePreferenceLabels, type PreferencePatch } from '../../features/accessibility-agent/core/preferences';
import type { AccessibilityPreferences, JourneyStep } from '../../types';
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel';
import { ClickBusLogo } from '../brand/ClickBusLogo';

interface HeaderProps {
  canUndo: boolean;
  getPreferences(): AccessibilityPreferences;
  getStateRevision(): number;
  onApplyPreferences(patch: PreferencePatch): boolean;
  onHome(): void;
  onResetPreferences(): boolean;
  onUndoPreferences(): boolean;
  page: JourneyStep;
  pageEpoch: number;
  preferences: AccessibilityPreferences;
  stateRevision: number;
  storageAvailable: boolean;
}

export function Header(props: HeaderProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelSession, setPanelSession] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 820px)').matches);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeModes = getActivePreferenceLabels(props.preferences).length;

  const closePanel = useCallback((restoreFocus = true) => {
    setIsPanelOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const openPanel = () => {
    setPanelSession((current) => current + 1);
    setIsPanelOpen(true);
  };

  useEffect(() => {
    const media = window.matchMedia('(max-width: 820px)');
    const update = () => setIsMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isPanelOpen) return;
      const target = event.target as Node;
      const popover = document.getElementById('accessibility-panel');
      if ((!isMobile && !containerRef.current?.contains(target)) || (isMobile && target === popover)) closePanel();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPanelOpen) closePanel();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closePanel, isMobile, isPanelOpen]);

  useEffect(() => {
    if (!isPanelOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => document.getElementById('accessibility-request')?.focus());
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !isMobile) return;
      const panel = document.getElementById('accessibility-panel');
      const focusable = Array.from(panel?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trapFocus);
    return () => {
      document.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, isPanelOpen]);

  useEffect(() => {
    if (isPanelOpen) closePanel(false);
    // A mudança de etapa invalida qualquer plano pendente e desmonta o painel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.pageEpoch]);

  const navigateTo = (id: string) => {
    if (isPanelOpen) closePanel(false);
    props.onHome();
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <button className="brand-button" type="button" onClick={() => { if (isPanelOpen) closePanel(false); props.onHome(); }} aria-label="Ir para o início"><ClickBusLogo className="clickbus-logo" /></button>
        <nav className="main-nav" aria-label="Navegação principal">
          <button type="button" onClick={() => navigateTo('ofertas')}><Tag aria-hidden="true" size={18} /> Ofertas</button>
          <button type="button" onClick={() => navigateTo('ajuda')}><CircleHelp aria-hidden="true" size={18} /> Ajuda</button>
        </nav>

        <div className="accessibility-menu" ref={containerRef}>
          <button className="accessibility-trigger" type="button" aria-label="Acessibilidade" aria-expanded={isPanelOpen} aria-controls="accessibility-panel" ref={triggerRef} onClick={() => (isPanelOpen ? closePanel() : openPanel())}>
            <Accessibility aria-hidden="true" size={22} />
            <span aria-hidden="true">Acessibilidade</span>
            {activeModes > 0 ? <span className="mode-count" aria-label={`${activeModes} ajustes ativos`}>{activeModes}</span> : null}
            <ChevronDown aria-hidden="true" size={18} />
          </button>
          {isPanelOpen ? (
            <div id="accessibility-panel" className="accessibility-menu__popover" role={isMobile ? 'dialog' : undefined} aria-modal={isMobile ? true : undefined} aria-label={isMobile ? 'Acessibilidade' : undefined}>
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
          ) : null}
        </div>
      </div>
    </header>
  );
}
