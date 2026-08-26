import { Accessibility } from 'lucide-react';
import type { AccessibilityPreferences } from '../../types';

interface ActiveModeBannerProps {
  preferences: AccessibilityPreferences;
}

export function ActiveModeBanner({ preferences }: ActiveModeBannerProps) {
  const labels = [
    preferences.highContrast ? 'Alto contraste' : null,
    preferences.elderlyMode ? 'Modo idoso' : null,
  ].filter(Boolean);

  if (labels.length === 0) return null;

  return (
    <div className="active-mode-banner" role="status">
      <Accessibility aria-hidden="true" size={20} />
      <strong>{labels.join(' + ')} {labels.length > 1 ? 'ativos' : 'ativo'}</strong>
      <span>Você pode mudar essas opções no menu Acessibilidade.</span>
    </div>
  );
}

