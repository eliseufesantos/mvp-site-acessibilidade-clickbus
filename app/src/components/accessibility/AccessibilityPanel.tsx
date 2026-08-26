import { RotateCcw, ShieldCheck } from 'lucide-react';
import type { AccessibilityPreferences } from '../../types';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';

interface AccessibilityPanelProps {
  preferences: AccessibilityPreferences;
  onReset: () => void;
  onToggle: (key: keyof AccessibilityPreferences) => void;
}

export function AccessibilityPanel({ preferences, onReset, onToggle }: AccessibilityPanelProps) {
  return (
    <section className="accessibility-panel" aria-label="Preferências de acessibilidade">
      <div className="accessibility-panel__heading">
        <ShieldCheck aria-hidden="true" size={22} />
        <div>
          <h2>Ajuste a experiência</h2>
          <p>As mudanças são aplicadas imediatamente.</p>
        </div>
      </div>

      <Switch
        checked={preferences.highContrast}
        label="Alto contraste"
        description="Troca cores por preto, branco e amarelo."
        onChange={() => onToggle('highContrast')}
      />
      <Switch
        checked={preferences.elderlyMode}
        label="Modo idoso"
        description="Amplia textos, botões e espaçamentos."
        onChange={() => onToggle('elderlyMode')}
      />
      <Switch
        checked={preferences.reducedMotion}
        label="Reduzir animações"
        description="Evita movimentos que podem causar desconforto."
        onChange={() => onToggle('reducedMotion')}
      />

      <p className="accessibility-panel__privacy">
        Preferências salvas somente neste dispositivo. Não inferimos idade nem diagnóstico.
      </p>
      <Button variant="quiet" onClick={onReset}>
        <RotateCcw aria-hidden="true" size={18} />
        Restaurar padrão
      </Button>
    </section>
  );
}

