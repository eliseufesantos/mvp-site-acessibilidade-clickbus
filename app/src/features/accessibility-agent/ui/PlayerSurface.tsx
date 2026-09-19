import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Languages, Pause, Play, Square, Volume2, X } from 'lucide-react';
import type { AccessibilityPreferences, JourneyStep } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { getPublicContentTargets, resolvePublicContent } from '../adapters/clickbus/content';
import type { RybenaMode } from '../adapters/libras/contracts';
import { librasAdapter } from '../adapters/libras/selection';
import { LIBRAS_SPEEDS } from '../core/preferences';

interface PlayerSurfaceProps {
  mode: RybenaMode;
  playerSpeed: AccessibilityPreferences['librasSpeed'];
  onSpeedChange(speed: AccessibilityPreferences['librasSpeed']): boolean;
  page: JourneyStep;
}

const COPY = {
  libras: {
    titleId: 'libras-title',
    title: 'Tradução em Libras',
    intro: 'O player externo será carregado somente quando você solicitar uma tradução.',
    contentLabel: 'Trecho público para traduzir',
    action: 'Traduzir trecho em Libras',
    loading: 'Carregando Rybená…',
    closeLabel: 'Fechar o player de Libras',
    stopLabel: 'Parar a tradução',
    empty: 'Esta etapa não oferece um trecho público para tradução.',
    transportLabel: 'Controles da tradução',
  },
  voz: {
    titleId: 'voice-title',
    title: 'Narração em voz',
    intro: 'A narração usa o mesmo player da Rybená, em modo de voz, e só carrega quando você pedir.',
    contentLabel: 'Trecho público para narrar',
    action: 'Ouvir o trecho em voz',
    loading: 'Carregando Rybená…',
    closeLabel: 'Fechar o player de voz',
    stopLabel: 'Parar a narração',
    empty: 'Esta etapa não oferece um trecho público para narração.',
    transportLabel: 'Controles da narração',
  },
} as const;

/**
 * Libras e voz são a mesma superfície em modos diferentes, porque são o mesmo
 * player da Rybená. O player externo só é carregado após ação explícita da
 * pessoa usuária — nunca na montagem.
 */
export function PlayerSurface({ mode, playerSpeed, onSpeedChange, page }: PlayerSurfaceProps) {
  const copy = COPY[mode];
  const targets = useMemo(() => getPublicContentTargets(page), [page]);
  const [contentRef, setContentRef] = useState(targets[0]?.id ?? '');
  const [feedback, setFeedback] = useState('');
  const selected = resolvePublicContent(page, contentRef) ?? targets[0] ?? null;
  const player = useSyncExternalStore(librasAdapter.subscribe, librasAdapter.getSnapshot, librasAdapter.getSnapshot);

  // Entrar na superfície declara o modo. Sem isso, os controles de transporte
  // agiriam sobre o modo anterior do player.
  useEffect(() => {
    void librasAdapter.setMode(mode);
    setFeedback('');
  }, [mode]);

  const run = async (action: () => Promise<{ message: string }>) => {
    const receipt = await action();
    setFeedback(receipt.message);
  };

  const start = async () => {
    if (!selected) {
      setFeedback(copy.empty);
      return;
    }
    await librasAdapter.setMode(mode);
    await run(() => librasAdapter.translate({ id: selected.id, text: selected.text }));
  };

  const changeSpeed = async (value: string) => {
    const speed = Number(value) as AccessibilityPreferences['librasSpeed'];
    if (!LIBRAS_SPEEDS.includes(speed)) return;
    onSpeedChange(speed);
    await run(() => librasAdapter.setSpeed(speed));
  };

  const loaded = player.state === 'ready' || player.state === 'translating' || player.state === 'paused';
  const playing = player.mode === mode && player.state === 'translating';
  const paused = player.mode === mode && player.state === 'paused';
  const Icon = mode === 'voz' ? Volume2 : Languages;

  return (
    <section className="libras-controls" aria-labelledby={copy.titleId}>
      <div className="libras-controls__heading">
        <div>
          <h4 id={copy.titleId}><Icon aria-hidden="true" /> {copy.title}</h4>
          <p>{copy.intro}</p>
        </div>
        <button type="button" aria-label={copy.closeLabel} onClick={() => void run(librasAdapter.close)} disabled={!loaded}><X aria-hidden="true" /></button>
      </div>

      <label htmlFor={`content-to-${mode}`}>{copy.contentLabel}</label>
      <select id={`content-to-${mode}`} value={selected?.id ?? ''} onChange={(event) => setContentRef(event.target.value)} disabled={targets.length === 0}>
        {targets.length === 0
          ? <option value="">Nenhum trecho disponível nesta etapa</option>
          : targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
      </select>

      <label htmlFor={`player-speed-${mode}`}>Velocidade</label>
      <select id={`player-speed-${mode}`} value={playerSpeed} onChange={(event) => void changeSpeed(event.target.value)}>
        {LIBRAS_SPEEDS.map((speed) => <option key={speed} value={speed}>{speed === 1 ? 'Normal' : `${speed}×`}</option>)}
      </select>

      <Button fullWidth onClick={() => void start()} disabled={!selected || player.state === 'loading'}>
        <Icon aria-hidden="true" /> {player.state === 'loading' ? copy.loading : copy.action}
      </Button>

      <div className="libras-controls__row" role="group" aria-label={copy.transportLabel}>
        <Button variant="quiet" onClick={() => void run(librasAdapter.pause)} disabled={!playing}><Pause aria-hidden="true" /> Pausar</Button>
        <Button variant="quiet" onClick={() => void run(librasAdapter.resume)} disabled={!paused}><Play aria-hidden="true" /> Retomar</Button>
        <button type="button" aria-label={copy.stopLabel} onClick={() => void run(librasAdapter.stop)} disabled={!playing && !paused}><Square aria-hidden="true" /></button>
      </div>

      <p className={`rybena-status${player.state === 'failed' ? ' rybena-status--error' : ''}`} role="status">{feedback || player.message}</p>
      <a href={player.attributionUrl} target="_blank" rel="noreferrer">{player.attribution}</a>
    </section>
  );
}
