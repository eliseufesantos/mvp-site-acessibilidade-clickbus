import type { AccessibilityPreferences } from '../../../../types';
import type { LibrasAdapter, LibrasContent, LibrasReceipt, LibrasSnapshot, LibrasState } from './contracts';

const RYBENA_SCRIPT_ID = 'rybena-api-script';
const RYBENA_SCRIPT_URL = 'https://cdn.rybena.com.br/dom/master/latest/rybena.js?mode=api';
const RYBENA_LOAD_TIMEOUT_MS = 15_000;
const RYBENA_ATTRIBUTION = 'Tradução em Libras por Rybená';
const RYBENA_ATTRIBUTION_URL = 'https://www.rybena.com.br/';

export interface RybenaRuntime {
  closePlayer(): void;
  handleLoaded(callback: () => void): void;
  handleTranslate(callback: () => void): void;
  isTranslating(): boolean;
  openPlayer(): void;
  pause(): void;
  play(): void;
  setSpeed(speed: AccessibilityPreferences['librasSpeed']): void;
  stop(): void;
  switchToLibras(): void;
  translate(text: string): void;
}

interface RybenaWindow extends Window {
  RybenaApi?: {
    getInstance(): RybenaRuntime;
  };
  RybenaDOM?: {
    getInstance(): {
      getRybenaScripts(mode?: 'hidden'): Promise<unknown>;
    };
  };
}

type RuntimeLoader = () => Promise<RybenaRuntime>;

let providerLoadPromise: Promise<RybenaRuntime> | null = null;

const getRuntime = (): RybenaRuntime | null => {
  if (typeof window === 'undefined') return null;
  return (window as RybenaWindow).RybenaApi?.getInstance() ?? null;
};

const getScriptLoader = () => {
  if (typeof window === 'undefined') return null;
  return (window as RybenaWindow).RybenaDOM?.getInstance() ?? null;
};

const waitUntilReady = (runtime: RybenaRuntime): Promise<RybenaRuntime> => new Promise((resolve, reject) => {
  const timeout = window.setTimeout(() => {
    reject(new Error('A Rybená demorou para responder. Tente novamente.'));
  }, RYBENA_LOAD_TIMEOUT_MS);

  try {
    runtime.handleLoaded(() => {
      window.clearTimeout(timeout);
      resolve(runtime);
    });
  } catch {
    window.clearTimeout(timeout);
    reject(new Error('A API da Rybená não pôde ser inicializada.'));
  }
});

const loadRybenaRuntime: RuntimeLoader = () => {
  if (providerLoadPromise) return providerLoadPromise;

  providerLoadPromise = new Promise<RybenaRuntime>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('A Rybená só pode ser carregada no navegador.'));
      return;
    }

    const finish = async () => {
      try {
        const availableRuntime = getRuntime();
        if (availableRuntime) {
          await waitUntilReady(availableRuntime);
          resolve(availableRuntime);
          return;
        }

        const scriptLoader = getScriptLoader();
        if (!scriptLoader) throw new Error('O carregador da API Rybená não ficou disponível.');
        await scriptLoader.getRybenaScripts('hidden');
        const runtime = getRuntime();
        if (!runtime) {
          throw new Error('A Rybená não autorizou este endereço. Solicite a liberação do domínio ou um token de demonstração.');
        }
        await waitUntilReady(runtime);
        resolve(runtime);
      } catch (error) {
        reject(error);
      }
    };

    const existing = document.getElementById(RYBENA_SCRIPT_ID) as HTMLScriptElement | null;
    if (getRuntime() || getScriptLoader()) {
      void finish();
      return;
    }

    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('Não foi possível baixar o script da Rybená.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = RYBENA_SCRIPT_ID;
    script.src = RYBENA_SCRIPT_URL;
    script.async = true;
    script.setAttribute('doNotTrack', 'true');
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => {
      script.remove();
      reject(new Error('Não foi possível baixar o script da Rybená.'));
    }, { once: true });
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    providerLoadPromise = null;
    throw error;
  });

  return providerLoadPromise;
};

const initialSnapshot = (): LibrasSnapshot => ({
  state: 'idle',
  message: 'Pronto para carregar a tradução demonstrativa em Libras.',
  attribution: RYBENA_ATTRIBUTION,
  attributionUrl: RYBENA_ATTRIBUTION_URL,
});

export class RybenaBrowserAdapter implements LibrasAdapter {
  private runtime: RybenaRuntime | null = null;
  private snapshot = initialSnapshot();
  private readonly listeners = new Set<() => void>();
  private initializePromise: Promise<LibrasReceipt> | null = null;
  private speed: AccessibilityPreferences['librasSpeed'] = 1;

  constructor(private readonly loadRuntime: RuntimeLoader = loadRybenaRuntime) {}

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  initialize = async (): Promise<LibrasReceipt> => {
    if (this.runtime && this.snapshot.state !== 'failed') return this.accepted();
    if (this.initializePromise) return this.initializePromise;

    this.update('loading', 'Carregando a tradução em Libras…');
    this.initializePromise = this.loadRuntime()
      .then((runtime) => {
        this.runtime = runtime;
        runtime.handleTranslate(() => {
          if (this.snapshot.state === 'translating' || this.snapshot.state === 'paused') {
            this.update('ready', 'Tradução concluída. Você pode escolher outro trecho.');
          }
        });
        runtime.setSpeed(this.speed);
        this.update('ready', 'Rybená carregada. Escolha um trecho público para traduzir.');
        return this.accepted();
      })
      .catch((error: unknown) => this.failed(error))
      .finally(() => {
        this.initializePromise = null;
      });

    return this.initializePromise;
  };

  open = async () => this.withRuntime('ready', 'Player de Libras aberto.', (runtime) => runtime.openPlayer());

  close = async (): Promise<LibrasReceipt> => {
    if (!this.runtime) return this.accepted('O player de Libras já está fechado.');
    return this.callRuntime('ready', 'Player de Libras fechado.', (runtime) => runtime.closePlayer());
  };

  translate = async (content: LibrasContent): Promise<LibrasReceipt> => {
    const text = content.text.trim();
    if (!text) return this.failed(new Error('Escolha um trecho antes de solicitar a tradução.'));

    const initialized = await this.initialize();
    if (initialized.status !== 'accepted' || !this.runtime) return initialized;

    return this.callRuntime('translating', 'Traduzindo o trecho selecionado em Libras…', (runtime) => {
      runtime.openPlayer();
      runtime.switchToLibras();
      runtime.setSpeed(this.speed);
      runtime.translate(text);
    });
  };

  pause = async () => this.withRuntime('paused', 'Tradução pausada.', (runtime) => runtime.pause());

  resume = async () => this.withRuntime('translating', 'Tradução retomada.', (runtime) => runtime.play());

  stop = async () => this.withRuntime('ready', 'Tradução interrompida.', (runtime) => runtime.stop());

  setSpeed = async (speed: AccessibilityPreferences['librasSpeed']): Promise<LibrasReceipt> => {
    this.speed = speed;
    if (!this.runtime) return this.accepted('Velocidade salva para a próxima tradução.');
    return this.callRuntime(this.snapshot.state, 'Velocidade da tradução atualizada.', (runtime) => runtime.setSpeed(speed));
  };

  private withRuntime = async (
    state: LibrasState,
    message: string,
    action: (runtime: RybenaRuntime) => void,
  ): Promise<LibrasReceipt> => {
    const initialized = await this.initialize();
    if (initialized.status !== 'accepted' || !this.runtime) return initialized;
    return this.callRuntime(state, message, action);
  };

  private callRuntime = (
    state: LibrasState,
    message: string,
    action: (runtime: RybenaRuntime) => void,
  ): LibrasReceipt => {
    if (!this.runtime) return this.failed(new Error('A Rybená ainda não está disponível.'));
    try {
      action(this.runtime);
      this.update(state, message);
      return this.accepted();
    } catch (error) {
      return this.failed(error);
    }
  };

  private update = (state: LibrasState, message: string) => {
    this.snapshot = { ...this.snapshot, state, message };
    this.listeners.forEach((listener) => listener());
  };

  private accepted = (message = this.snapshot.message): LibrasReceipt => ({
    status: 'accepted',
    state: this.snapshot.state,
    message,
  });

  private failed = (error: unknown): LibrasReceipt => {
    const message = error instanceof Error ? error.message : 'A tradução em Libras não pôde ser executada.';
    this.update('failed', message);
    return { status: 'failed', state: 'failed', message };
  };
}

export const rybenaAdapter = new RybenaBrowserAdapter();
