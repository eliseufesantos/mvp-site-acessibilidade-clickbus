import type { AccessibilityPreferences } from '../../../../types';

/** Texto obrigatorio do aviso exibido enquanto `RybenaSnapshot.simulated` for verdadeiro. */
export const RYBENA_SIMULATION_NOTICE = 'Simulação de Libras e voz — ambiente de desenvolvimento';

/**
 * Libras e voz **não** são dois serviços: são dois modos do mesmo player da
 * Rybená, compartilhando `translate`, `play`, `pause`, `stop` e `setSpeed`.
 * Por isso existe um único port com `setMode`, e não dois ports concorrentes —
 * duplicar o ciclo de vida criaria dois players disputando o mesmo runtime.
 */
export type RybenaMode = 'libras' | 'voz';

export type RybenaState =
  | 'idle'
  | 'unavailable_pending_provider_configuration'
  | 'loading'
  | 'ready'
  | 'translating'
  | 'paused'
  | 'failed';

export interface RybenaSnapshot {
  state: RybenaState;
  /** Modo ativo do player. A interface reflete isto nos cartões. */
  mode: RybenaMode;
  message: string;
  attribution: string;
  attributionUrl: string;
  /**
   * Verdadeiro apenas no adaptador de desenvolvimento, que percorre a máquina
   * de estados sem rede e sem tradução real. A interface é obrigada a exibir
   * aviso permanente enquanto isto for verdadeiro: simulação nunca pode ser
   * confundida com tradução em Libras nem com narração.
   */
  simulated: boolean;
}

export interface RybenaReceipt {
  status: 'accepted' | 'unavailable' | 'failed';
  state: RybenaState;
  message: string;
}

export interface RybenaContent {
  id: string;
  text: string;
}

/**
 * Superfície usada pelo projeto. Deliberadamente **não** declara nenhum dos
 * métodos visuais da Rybená (`toggleZoom`, `toggleDarkContrast`,
 * `toggleReadingMask`…): os ajustes visuais são responsabilidade exclusiva do
 * executor local. Se os dois aplicarem, os efeitos somam e quebram — ver seção
 * 7.4 do plano. Não acrescente esses métodos aqui.
 */
export interface RybenaAdapter {
  getSnapshot(): RybenaSnapshot;
  initialize(): Promise<RybenaReceipt>;
  setMode(mode: RybenaMode): Promise<RybenaReceipt>;
  open(): Promise<RybenaReceipt>;
  close(): Promise<RybenaReceipt>;
  translate(content: RybenaContent): Promise<RybenaReceipt>;
  pause(): Promise<RybenaReceipt>;
  resume(): Promise<RybenaReceipt>;
  stop(): Promise<RybenaReceipt>;
  setSpeed(speed: AccessibilityPreferences['librasSpeed']): Promise<RybenaReceipt>;
  subscribe(listener: () => void): () => void;
}
