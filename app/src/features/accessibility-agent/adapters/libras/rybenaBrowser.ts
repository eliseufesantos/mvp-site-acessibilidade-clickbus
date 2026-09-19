import type { AccessibilityPreferences } from '../../../../types';
import type { RybenaAdapter, RybenaContent, RybenaMode, RybenaReceipt, RybenaSnapshot, RybenaState } from './contracts';

const RYBENA_SCRIPT_ID = 'rybena-api-script';
const RYBENA_CONFIG_URL = '/api/accessibility/rybena';
const RYBENA_SCRIPT_ORIGIN = 'https://cdn.rybena.com.br';
const RYBENA_SCRIPT_PATH = '/dom/master/latest/rybena.js';
const RYBENA_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
const RYBENA_CONFIG_TIMEOUT_MS = 10_000;
const RYBENA_LOAD_TIMEOUT_MS = 15_000;
const RYBENA_ATTRIBUTION = 'Tradução em Libras por Rybená';
const RYBENA_ATTRIBUTION_URL = 'https://www.rybena.com.br/';

interface RybenaConfiguration {
  scriptUrl?: unknown;
}

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
  switchToVoz(): void;
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

export const parseRybenaScriptUrl = (value: unknown): string => {
  if (typeof value !== 'string') throw new Error('A configuração da Rybená é inválida.');

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('A configuração da Rybená é inválida.');
  }

  const allowedParameters = new Set(['token', 'mode', 'disableAccessibilityButton', 'doNotTrack']);
  const hasUnexpectedParameter = Array.from(url.searchParams.keys())
    .some((parameter) => !allowedParameters.has(parameter));
  const token = url.searchParams.get('token') ?? '';
  if (
    url.origin !== RYBENA_SCRIPT_ORIGIN
    || url.pathname !== RYBENA_SCRIPT_PATH
    || url.username !== ''
    || url.password !== ''
    || url.hash !== ''
    || hasUnexpectedParameter
    || url.searchParams.size !== 4
    || url.searchParams.getAll('token').length !== 1
    || url.searchParams.getAll('mode').length !== 1
    || url.searchParams.getAll('disableAccessibilityButton').length !== 1
    || url.searchParams.getAll('doNotTrack').length !== 1
    || !RYBENA_TOKEN_PATTERN.test(token)
    || url.searchParams.get('mode') !== 'full'
    || url.searchParams.get('disableAccessibilityButton') !== 'true'
    || url.searchParams.get('doNotTrack') !== 'true'
  ) {
    throw new Error('A configuração da Rybená é inválida.');
  }

  return url.toString();
};

const fetchRybenaScriptUrl = async (): Promise<string> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), RYBENA_CONFIG_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(RYBENA_CONFIG_URL, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
  } catch {
    throw new Error('Não foi possível carregar a configuração da Rybená.');
  } finally {
    window.clearTimeout(timeout);
  }

  if (response.status === 503) {
    throw new Error('A Rybená ainda não foi configurada neste ambiente.');
  }
  if (!response.ok) {
    throw new Error('Não foi possível carregar a configuração da Rybená.');
  }

  let configuration: RybenaConfiguration;
  try {
    configuration = await response.json() as RybenaConfiguration;
  } catch {
    throw new Error('A configuração da Rybená é inválida.');
  }
  return parseRybenaScriptUrl(configuration.scriptUrl);
};

const withProviderTimeout = <T>(operation: Promise<T>, message: string): Promise<T> => new Promise((resolve, reject) => {
  const timeout = window.setTimeout(() => reject(new Error(message)), RYBENA_LOAD_TIMEOUT_MS);
  operation.then(
    (value) => {
      window.clearTimeout(timeout);
      resolve(value);
    },
    (error: unknown) => {
      window.clearTimeout(timeout);
      reject(error);
    },
  );
});

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
        // Sem `'hidden'`: em `mode=full` a barra do fornecedor é a interface, e
        // é nela que a pessoa seleciona o texto.
        await withProviderTimeout(
          scriptLoader.getRybenaScripts(),
          'A Rybená demorou para preparar o player. Tente novamente.',
        );
        const runtime = getRuntime();
        if (!runtime) {
          throw new Error('A Rybená não autorizou este endereço. Solicite a liberação do domínio ou um token de demonstração.');
        }
        await waitUntilReady(runtime);
        resolve(runtime);
      } catch (error) {
        if (!getRuntime() && !getScriptLoader()) {
          document.getElementById(RYBENA_SCRIPT_ID)?.remove();
        }
        reject(error);
      }
    };

    const existing = document.getElementById(RYBENA_SCRIPT_ID) as HTMLScriptElement | null;
    if (getRuntime() || getScriptLoader()) {
      void finish();
      return;
    }

    if (existing) {
      if (existing.dataset.rybenaState !== 'loaded') {
        const timeout = window.setTimeout(() => {
          existing.remove();
          reject(new Error('A Rybená demorou para carregar. Tente novamente.'));
        }, RYBENA_LOAD_TIMEOUT_MS);
        existing.addEventListener('load', () => {
          window.clearTimeout(timeout);
          existing.dataset.rybenaState = 'loaded';
          void finish();
        }, { once: true });
        existing.addEventListener('error', () => {
          window.clearTimeout(timeout);
          existing.remove();
          reject(new Error('Não foi possível baixar o script da Rybená.'));
        }, { once: true });
        return;
      }
      existing.remove();
    }

    void fetchRybenaScriptUrl()
      .then((scriptUrl) => {
        const script = document.createElement('script');
        script.id = RYBENA_SCRIPT_ID;
        script.src = scriptUrl;
        script.async = true;
        script.referrerPolicy = 'no-referrer';
        script.setAttribute('doNotTrack', 'true');
        const timeout = window.setTimeout(() => {
          script.remove();
          reject(new Error('A Rybená demorou para carregar. Tente novamente.'));
        }, RYBENA_LOAD_TIMEOUT_MS);
        script.addEventListener('load', () => {
          window.clearTimeout(timeout);
          script.dataset.rybenaState = 'loaded';
          void finish();
        }, { once: true });
        script.addEventListener('error', () => {
          window.clearTimeout(timeout);
          script.remove();
          reject(new Error('Não foi possível baixar o script da Rybená.'));
        }, { once: true });
        document.head.appendChild(script);
      })
      .catch(reject);
  }).catch((error: unknown) => {
    providerLoadPromise = null;
    throw error;
  });

  return providerLoadPromise;
};

const initialSnapshot = (): RybenaSnapshot => ({
  state: 'idle',
  mode: 'libras',
  message: 'Pronto para carregar a tradução demonstrativa em Libras.',
  attribution: RYBENA_ATTRIBUTION,
  attributionUrl: RYBENA_ATTRIBUTION_URL,
  simulated: false,
});

export class RybenaBrowserAdapter implements RybenaAdapter {
  private runtime: RybenaRuntime | null = null;
  private snapshot = initialSnapshot();
  private readonly listeners = new Set<() => void>();
  private initializePromise: Promise<RybenaReceipt> | null = null;
  private speed: AccessibilityPreferences['librasSpeed'] = 1;
  private mode: RybenaMode = 'libras';

  constructor(private readonly loadRuntime: RuntimeLoader = loadRybenaRuntime) {}

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  initialize = async (): Promise<RybenaReceipt> => {
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
        if (this.mode === 'voz') runtime.switchToVoz();
        else runtime.switchToLibras();
        this.update('ready', 'Rybená carregada. Escolha um trecho público.', this.mode);
        return this.accepted();
      })
      .catch((error: unknown) => this.failed(error))
      .finally(() => {
        this.initializePromise = null;
      });

    return this.initializePromise;
  };

  /**
   * Libras e voz são modos do mesmo player: a troca é `switchToLibras()` ou
   * `switchToVoz()`, nunca um segundo player.
   */
  setMode = async (mode: RybenaMode): Promise<RybenaReceipt> => {
    if (this.mode === mode && this.runtime) return this.accepted('O player já estava nesse modo.');
    this.mode = mode;
    if (!this.runtime) return this.accepted('Modo salvo para a próxima solicitação.');
    return this.callRuntime(
      this.snapshot.state,
      mode === 'voz' ? 'Player em modo de voz.' : 'Player em modo de Libras.',
      (runtime) => (mode === 'voz' ? runtime.switchToVoz() : runtime.switchToLibras()),
      mode,
    );
  };

  open = async () => this.withRuntime('ready', 'Player aberto.', (runtime) => runtime.openPlayer());

  close = async (): Promise<RybenaReceipt> => {
    if (!this.runtime) return this.accepted('O player já está fechado.');
    return this.callRuntime('ready', 'Player fechado.', (runtime) => runtime.closePlayer());
  };

  translate = async (content: RybenaContent): Promise<RybenaReceipt> => {
    const text = content.text.trim();
    if (!text) return this.failed(new Error('Escolha um trecho antes de solicitar a tradução.'));

    const initialized = await this.initialize();
    if (initialized.status !== 'accepted' || !this.runtime) return initialized;

    const message = this.mode === 'voz'
      ? 'Narrando o trecho selecionado…'
      : 'Traduzindo o trecho selecionado em Libras…';
    return this.callRuntime('translating', message, (runtime) => {
      runtime.openPlayer();
      if (this.mode === 'voz') runtime.switchToVoz();
      else runtime.switchToLibras();
      runtime.setSpeed(this.speed);
      runtime.translate(text);
    });
  };

  pause = async () => this.withRuntime('paused', 'Tradução pausada.', (runtime) => runtime.pause());

  resume = async () => this.withRuntime('translating', 'Tradução retomada.', (runtime) => runtime.play());

  stop = async () => this.withRuntime('ready', 'Tradução interrompida.', (runtime) => runtime.stop());

  setSpeed = async (speed: AccessibilityPreferences['librasSpeed']): Promise<RybenaReceipt> => {
    this.speed = speed;
    if (!this.runtime) return this.accepted('Velocidade salva para a próxima tradução.');
    return this.callRuntime(this.snapshot.state, 'Velocidade da tradução atualizada.', (runtime) => runtime.setSpeed(speed));
  };

  private withRuntime = async (
    state: RybenaState,
    message: string,
    action: (runtime: RybenaRuntime) => void,
  ): Promise<RybenaReceipt> => {
    const initialized = await this.initialize();
    if (initialized.status !== 'accepted' || !this.runtime) return initialized;
    return this.callRuntime(state, message, action);
  };

  private callRuntime = (
    state: RybenaState,
    message: string,
    action: (runtime: RybenaRuntime) => void,
    mode?: RybenaMode,
  ): RybenaReceipt => {
    if (!this.runtime) return this.failed(new Error('A Rybená ainda não está disponível.'));
    try {
      action(this.runtime);
      this.update(state, message, mode);
      return this.accepted();
    } catch (error) {
      return this.failed(error);
    }
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

  private failed = (error: unknown): RybenaReceipt => {
    const message = error instanceof Error ? error.message : 'A tradução em Libras não pôde ser executada.';
    this.update('failed', message);
    return { status: 'failed', state: 'failed', message };
  };
}

// A escolha do adaptador vive em `selection.ts`. Nao exporte um singleton
// daqui: haveria duas instancias do player concorrendo pelo mesmo runtime.
