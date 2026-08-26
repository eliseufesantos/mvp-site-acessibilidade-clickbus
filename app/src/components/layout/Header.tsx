import { Accessibility, ChevronDown, CircleHelp, ReceiptText, Tag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AccessibilityPreferences } from '../../types';
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel';
import { ClickBusLogo } from '../brand/ClickBusLogo';

interface HeaderProps {
  onHome: () => void;
  onResetPreferences: () => void;
  onTogglePreference: (key: keyof AccessibilityPreferences) => void;
  preferences: AccessibilityPreferences;
}

export function Header({
  onHome,
  onResetPreferences,
  onTogglePreference,
  preferences,
}: HeaderProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeModes = Number(preferences.highContrast) + Number(preferences.elderlyMode);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsPanelOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPanelOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <button className="brand-button" type="button" onClick={onHome} aria-label="Ir para o início">
          <ClickBusLogo className="clickbus-logo" />
        </button>

        <nav className="main-nav" aria-label="Navegação principal">
          <a href="#ofertas">
            <Tag aria-hidden="true" size={18} /> Ofertas
          </a>
          <a href="#pedidos">
            <ReceiptText aria-hidden="true" size={18} /> Meus pedidos
          </a>
          <a href="#ajuda">
            <CircleHelp aria-hidden="true" size={18} /> Ajuda
          </a>
        </nav>

        <div className="accessibility-menu" ref={containerRef}>
          <button
            className="accessibility-trigger"
            type="button"
            aria-expanded={isPanelOpen}
            aria-controls="accessibility-panel"
            onClick={() => setIsPanelOpen((open) => !open)}
          >
            <Accessibility aria-hidden="true" size={22} />
            <span>Acessibilidade</span>
            {activeModes > 0 ? <span className="mode-count">{activeModes}</span> : null}
            <ChevronDown aria-hidden="true" size={18} />
          </button>
          {isPanelOpen ? (
            <div id="accessibility-panel" className="accessibility-menu__popover">
              <AccessibilityPanel
                preferences={preferences}
                onReset={onResetPreferences}
                onToggle={onTogglePreference}
              />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

