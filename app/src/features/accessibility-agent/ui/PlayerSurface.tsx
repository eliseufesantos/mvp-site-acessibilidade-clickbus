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
    takeOver: 'Pedir a tradução em Libras vai substituí-la.',
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
    takeOver: 'Pedir a narração vai substituí-la.',
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

  // Só limpa o texto de retorno. **Não** troque o modo aqui.
  //
  // Ver uma superfície não é usá-la. Trocar o modo na montagem fazia com que
  // abrir o cartão Voz durante uma tradução em Libras chamasse `switchToVoz()`
  // no player em andamento, e ainda deixava a interface anunciar a narração
  // como ativa, habilitando os controles de transporte de voz sobre o que era
  // uma tradução. Pior: o executor decide se uma ação de transporte é legítima
  // olhando `getSnapshot().mode`, então apenas visualizar a superfície furava
  // esse guard. O modo passa a mudar só quando a pessoa inicia a reprodução.
  useEffect(() => {
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
  // O player é um só. Se o outro modo está ocupando, diga isso em vez de
  // deixar a pessoa achar que os controles daqui valem para o que está tocando.
  const busyInOtherMode = player.mode !== mode
    && (player.state === 'translating' || player.state === 'paused');
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

      {busyInOtherMode ? (
        <p className="player-busy-note">
          {player.mode === 'voz'
            ? 'O player está ocupado com uma narração em voz.'
            : 'O player está ocupado com uma tradução em Libras.'}{' '}
          {copy.takeOver}
        </p>
      ) : null}

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
