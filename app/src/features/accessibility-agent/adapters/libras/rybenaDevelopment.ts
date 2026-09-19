import type { AccessibilityPreferences } from '../../../../types';
import { RYBENA_SIMULATION_NOTICE } from './contracts';
import type { RybenaAdapter, RybenaContent, RybenaMode, RybenaReceipt, RybenaSnapshot, RybenaState } from './contracts';

/**
 * Adaptador de DESENVOLVIMENTO. Percorre a mesma máquina de estados do
 * adaptador real (`idle → loading → ready → translating → paused`) sem nenhuma
 * rede, sem script de terceiro e sem tradução.
 *
 * Existe porque o token da Rybená é preso ao domínio autorizado: em
 * `127.0.0.1` o fornecedor recusa a origem, então os caminhos de Libras e voz
 * não teriam como ser exercitados localmente.
 *
 * Isto NÃO é tradução em Libras e não prova nada sobre a Rybená. Toda
 * interface que o usar é obrigada a exibir aviso permanente de simulação,
 * sinalizado por `snapshot.simulated`. A seleção deste adaptador está em
 * `selection.ts` e é tratada como código de segurança.
 */

const SIMULATION_ATTRIBUTION = 'Simulação local — nenhuma tradução ou narração real foi executada';
const SIMULATION_ATTRIBUTION_URL = 'https://www.rybena.com.br/';

/** Atrasos curtos e determinísticos, só para a interface percorrer os estados. */
export const RYBENA_SIMULATION_TIMINGS = {
  load: 240,
  command: 60,
  translation: 2_600,
} as const;

export interface RybenaDevelopmentOptions {
  /** Injetável para que o teste não dependa de relógio. */
  delay?(milliseconds: number): Promise<void>;
  /** Devolve um cancelador, espelhando `handleTranslate` do runtime real. */
  schedule?(callback: () => void, milliseconds: number): () => void;
}

const defaultDelay = (milliseconds: number) =>
  new Promise<void>((resolve) => { setTimeout(resolve, milliseconds); });

const defaultSchedule = (callback: () => void, milliseconds: number) => {
  const timer = setTimeout(callback, milliseconds);
  return () => clearTimeout(timer);
};

const initialSnapshot = (): RybenaSnapshot => ({
  state: 'idle',
  mode: 'libras',
  message: `${RYBENA_SIMULATION_NOTICE}. Nenhuma tradução ou narração real será executada.`,
  attribution: SIMULATION_ATTRIBUTION,
  attributionUrl: SIMULATION_ATTRIBUTION_URL,
  simulated: true,
});

export class RybenaDevelopmentAdapter implements RybenaAdapter {
  private snapshot = initialSnapshot();
  private readonly listeners = new Set<() => void>();
  private initializePromise: Promise<RybenaReceipt> | null = null;
  private loaded = false;
  private playerOpen = false;
  private cancelTranslation: (() => void) | null = null;
  private speed: AccessibilityPreferences['librasSpeed'] = 1;
  private mode: RybenaMode = 'libras';
  private readonly delay: (milliseconds: number) => Promise<void>;
  private readonly schedule: (callback: () => void, milliseconds: number) => () => void;

  constructor(options: RybenaDevelopmentOptions = {}) {
    this.delay = options.delay ?? defaultDelay;
    this.schedule = options.schedule ?? defaultSchedule;
  }

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  initialize = async (): Promise<RybenaReceipt> => {
    if (this.loaded) return this.accepted();
    if (this.initializePromise) return this.initializePromise;

    this.update('loading', 'Carregando a simulação de Libras…');
    this.initializePromise = this.delay(RYBENA_SIMULATION_TIMINGS.load).then(() => {
      this.loaded = true;
      this.update('ready', `${RYBENA_SIMULATION_NOTICE}. Escolha um trecho público para simular.`);
      return this.accepted();
    }).finally(() => {
      this.initializePromise = null;
    });

    return this.initializePromise;
  };

  /** Mesma troca de modo do adaptador real, sem rede. */
  setMode = async (mode: RybenaMode): Promise<RybenaReceipt> => {
    if (this.mode === mode) return this.accepted('O player já estava nesse modo.');
    this.mode = mode;
    if (!this.loaded) {
      this.snapshot = { ...this.snapshot, mode };
      this.listeners.forEach((listener) => listener());
      return this.accepted('Modo salvo para a próxima simulação.');
    }
    await this.delay(RYBENA_SIMULATION_TIMINGS.command);
    this.update(
      this.snapshot.state,
      mode === 'voz' ? 'Simulação em modo de voz.' : 'Simulação em modo de Libras.',
      mode,
    );
    return this.accepted();
  };

  open = async (): Promise<RybenaReceipt> => {
    const initialized = await this.initialize();
    if (initialized.status !== 'accepted') return initialized;
    if (this.playerOpen) return this.accepted('O player simulado já estava aberto.');
    await this.delay(RYBENA_SIMULATION_TIMINGS.command);
    this.playerOpen = true;
    this.update(this.snapshot.state, 'Player simulado aberto.');
    return this.accepted();
  };

  close = async (): Promise<RybenaReceipt> => {
    if (!this.loaded || !this.playerOpen) return this.accepted('O player simulado já está fechado.');
    await this.delay(RYBENA_SIMULATION_TIMINGS.command);
    this.stopTranslationTimer();
    this.playerOpen = false;
    this.update('ready', 'Player simulado fechado.');
    return this.accepted();
  };

  translate = async (content: RybenaContent): Promise<RybenaReceipt> => {
    const text = content.text.trim();
    if (!text) return this.failed('Escolha um trecho antes de solicitar a tradução.');

    const initialized = await this.initialize();
    if (initialized.status !== 'accepted') return initialized;

    await this.delay(RYBENA_SIMULATION_TIMINGS.command);
    this.stopTranslationTimer();
    this.playerOpen = true;
    this.update('translating', `${RYBENA_SIMULATION_NOTICE}: percorrendo o trecho selecionado em ${this.mode === 'voz' ? 'voz' : 'Libras'}.`);
    this.cancelTranslation = this.schedule(() => {
      this.cancelTranslation = null;
      if (this.snapshot.state !== 'translating') return;
      this.update('ready', 'Simulação concluída. Você pode escolher outro trecho.');
    }, Math.round(RYBENA_SIMULATION_TIMINGS.translation / this.speed));
    return this.accepted();
  };

  pause = async (): Promise<RybenaReceipt> => {
    if (this.snapshot.state === 'paused') return this.accepted('A simulação já estava pausada.');
    if (this.snapshot.state !== 'translating') return this.failed('Não há simulação em andamento para pausar.');
    await this.delay(RYBENA_SIMULATION_TIMINGS.command);
    this.stopTranslationTimer();
    this.update('paused', 'Simulação pausada.');
    return this.accepted();
  };

  resume = async (): Promise<RybenaReceipt> => {
    if (this.snapshot.state === 'translating') return this.accepted('A simulação já estava em andamento.');
    if (this.snapshot.state !== 'paused') return this.failed('Não há simulação pausada para retomar.');
    await this.delay(RYBENA_SIMULATION_TIMINGS.command);
    this.update('translating', 'Simulação retomada.');
    this.cancelTranslation = this.schedule(() => {
      this.cancelTranslation = null;
      if (this.snapshot.state !== 'translating') return;
      this.update('ready', 'Simulação concluída. Você pode escolher outro trecho.');
    }, Math.round(RYBENA_SIMULATION_TIMINGS.translation / this.speed));
    return this.accepted();
  };

  stop = async (): Promise<RybenaReceipt> => {
    if (this.snapshot.state !== 'translating' && this.snapshot.state !== 'paused') {
      return this.accepted('Não há simulação em andamento.');
    }
    await this.delay(RYBENA_SIMULATION_TIMINGS.command);
    this.stopTranslationTimer();
    this.update('ready', 'Simulação interrompida.');
    return this.accepted();
  };

  setSpeed = async (speed: AccessibilityPreferences['librasSpeed']): Promise<RybenaReceipt> => {
    if (this.speed === speed) return this.accepted('A velocidade já estava nesse valor.');
    this.speed = speed;
    if (!this.loaded) return this.accepted('Velocidade salva para a próxima simulação.');
    await this.delay(RYBENA_SIMULATION_TIMINGS.command);
    this.update(this.snapshot.state, 'Velocidade da simulação atualizada.');
    return this.accepted();
  };

  private stopTranslationTimer = () => {
    this.cancelTranslation?.();
    this.cancelTranslation = null;
  };

  private update = (state: RybenaState, message: string, mode = this.snapshot.mode) => {
    this.snapshot = { ...this.snapshot, state, message, mode };
    this.listeners.forEach((listener) => listener());
  };

  private accepted = (message = this.snapshot.message): RybenaReceipt => ({
    status: 'accepted',
    state: this.snapshot.state,
    message,
  });

  private failed = (message: string): RybenaReceipt => {
    this.update('failed', message);
    return { status: 'failed', state: 'failed', message };
  };
}
