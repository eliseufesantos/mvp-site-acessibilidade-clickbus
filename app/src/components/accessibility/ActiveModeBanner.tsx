import { Accessibility } from 'lucide-react';
import { getActivePreferenceLabels } from '../../features/accessibility-agent/core/preferences';
import type { AccessibilityPreferences } from '../../types';

interface ActiveModeBannerProps {
  preferences: AccessibilityPreferences;
}

export function ActiveModeBanner({ preferences }: ActiveModeBannerProps) {
  const labels = getActivePreferenceLabels(preferences);
  if (labels.length === 0) return null;

  return (
    <div className="active-mode-banner" role="status">
      <Accessibility aria-hidden="true" size={20} />
      <strong>{labels.join(' + ')} {labels.length > 1 ? 'ativos' : 'ativo'}</strong>
      <span>Altere ou desfaça no botão lateral de Acessibilidade.</span>
    </div>
  );
}
