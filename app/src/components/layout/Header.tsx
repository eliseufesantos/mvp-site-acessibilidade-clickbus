import { CircleHelp, Tag } from 'lucide-react';
import { ClickBusLogo } from '../brand/ClickBusLogo';

export const ACCESSIBILITY_SLOT_ID = 'accessibility-trigger-slot';

interface HeaderProps {
  onHome(): void;
}

export function Header({ onHome }: HeaderProps) {
  const navigateTo = (id: string) => {
    onHome();
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <button className="brand-button" type="button" onClick={onHome} aria-label="Ir para o início"><ClickBusLogo className="clickbus-logo" /></button>
        <nav className="main-nav" aria-label="Navegação principal">
          <button type="button" onClick={() => navigateTo('ofertas')}><Tag aria-hidden="true" size={18} /> Ofertas</button>
          <button type="button" onClick={() => navigateTo('ajuda')}><CircleHelp aria-hidden="true" size={18} /> Ajuda</button>
        </nav>
        {/* Encaixe do acionador de acessibilidade. O plugin o projeta aqui para
            que ele fique no header, que é sticky e portanto sempre alcançável,
            sem que o estado do painel precise subir para o App. */}
        <div className="site-header__a11y" id={ACCESSIBILITY_SLOT_ID} />
      </div>
    </header>
  );
}
