import { RotateCcw, Undo2 } from 'lucide-react';
import type { AccessibilityPreferences } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Switch } from '../../../components/ui/Switch';
import { COMFORTABLE_READING_PATCH, TEXT_SCALES, type PreferencePatch } from '../core/preferences';

interface PreferenceControlsProps {
  canUndo: boolean;
  preferences: AccessibilityPreferences;
  onApply(patch: PreferencePatch): boolean;
  onReset(): boolean;
  onUndo(): boolean;
  onStatus(message: string): void;
}

const scaleLabel: Record<AccessibilityPreferences['textScale'], string> = {
  1: '100%', 1.125: '112%', 1.25: '125%', 1.5: '150%',
};

export function PreferenceControls({ canUndo, preferences, onApply, onReset, onStatus, onUndo }: PreferenceControlsProps) {
  const apply = (patch: PreferencePatch, label: string) =>
    onStatus(onApply(patch) ? `${label} aplicado.` : `${label} já estava selecionado.`);
  const toggle = (key: 'highlightLinks' | 'highlightHeadings' | 'readingGuide' | 'readingMask' | 'reducedMotion') =>
    apply({ [key]: !preferences[key] }, 'Ajuste');

  return (
    <div className="a11y-settings">
      <section className="a11y-section" aria-labelledby="a11y-vision-title">
        <div className="a11y-section__heading"><h3 id="a11y-vision-title">Visão e tamanho</h3><span>Controles independentes</span></div>
        <Switch checked={preferences.contrast === 'high'} label="Alto contraste" description="Usa preto, branco e amarelo." onChange={() => apply({ contrast: preferences.contrast === 'high' ? 'default' : 'high' }, 'Contraste')} />
        <div className="preference-field">
          <div><strong>Tamanho do texto</strong><span>Amplia a tipografia sem zoom da página.</span></div>
          <div className="segmented-control segmented-control--four" role="group" aria-label="Tamanho do texto">
            {TEXT_SCALES.map((scale) => <button key={scale} type="button" aria-pressed={preferences.textScale === scale} onClick={() => apply({ textScale: scale }, `Texto em ${scaleLabel[scale]}`)}>{scaleLabel[scale]}</button>)}
          </div>
        </div>
        <Switch checked={preferences.controlSize === 'large'} label="Controles maiores" description="Amplia botões e áreas de toque." onChange={() => apply({ controlSize: preferences.controlSize === 'large' ? 'default' : 'large' }, 'Tamanho dos controles')} />
        <Switch checked={preferences.cursor === 'large'} label="Cursor grande" description="Aumenta o ponteiro dentro desta página." onChange={() => apply({ cursor: preferences.cursor === 'large' ? 'default' : 'large' }, 'Cursor')} />
        <Switch checked={preferences.highlightLinks} label="Destacar links" description="Sublinha e realça links de navegação." onChange={() => toggle('highlightLinks')} />
        <Switch checked={preferences.highlightHeadings} label="Destacar títulos" description="Marca visualmente títulos de conteúdo." onChange={() => toggle('highlightHeadings')} />
      </section>

      <section className="a11y-section" aria-labelledby="a11y-reading-title">
        <div className="a11y-section__heading"><h3 id="a11y-reading-title">Leitura</h3><span>Combine como preferir</span></div>
        <div className="preference-field">
          <div><strong>Espaço entre letras</strong></div>
          <div className="segmented-control" role="group" aria-label="Espaço entre letras">
            <button type="button" aria-pressed={preferences.letterSpacing === 'default'} onClick={() => apply({ letterSpacing: 'default' }, 'Espaçamento padrão')}>Padrão</button>
            <button type="button" aria-pressed={preferences.letterSpacing === 'wide'} onClick={() => apply({ letterSpacing: 'wide' }, 'Letras espaçadas')}>Amplo</button>
          </div>
        </div>
        <div className="preference-field">
          <div><strong>Espaço entre linhas</strong></div>
          <div className="segmented-control" role="group" aria-label="Espaço entre linhas">
            {(['default', 'comfortable', 'wide'] as const).map((value) => <button key={value} type="button" aria-pressed={preferences.lineHeight === value} onClick={() => apply({ lineHeight: value }, 'Entrelinha')}>{value === 'default' ? 'Padrão' : value === 'comfortable' ? 'Confortável' : 'Amplo'}</button>)}
          </div>
        </div>
        <div className="preference-field">
          <div><strong>Alinhamento</strong></div>
          <div className="segmented-control" role="group" aria-label="Alinhamento do texto">
            {(['original', 'left', 'center'] as const).map((value) => <button key={value} type="button" aria-pressed={preferences.textAlign === value} onClick={() => apply({ textAlign: value }, 'Alinhamento')}>{value === 'original' ? 'Original' : value === 'left' ? 'Esquerda' : 'Centro'}</button>)}
          </div>
        </div>
        <Switch checked={preferences.readingGuide} label="Guia de leitura" description="Acompanha o ponteiro ou o foco do teclado." onChange={() => toggle('readingGuide')} />
        <Switch checked={preferences.readingMask} label="Máscara de leitura" description="Escurece as áreas acima e abaixo da linha atual." onChange={() => toggle('readingMask')} />
        <Switch checked={preferences.reducedMotion} label="Reduzir animações" description="Evita movimentos que podem causar desconforto." onChange={() => toggle('reducedMotion')} />
        <Button variant="secondary" fullWidth onClick={() => apply(COMFORTABLE_READING_PATCH, 'Leitura confortável')}>Aplicar leitura confortável</Button>
      </section>

      <div className="panel-actions">
        <Button variant="quiet" onClick={() => onStatus(onReset() ? 'Aparência padrão restaurada.' : 'A aparência já está no padrão.')}><RotateCcw aria-hidden="true" /> Restaurar padrão</Button>
        <Button variant="quiet" onClick={() => onStatus(onUndo() ? 'Último ajuste desfeito.' : 'Não há ajuste para desfazer.')} disabled={!canUndo}><Undo2 aria-hidden="true" /> Desfazer</Button>
      </div>
    </div>
  );
}
