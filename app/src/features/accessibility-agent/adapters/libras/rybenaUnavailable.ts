import type { RybenaAdapter, RybenaReceipt, RybenaSnapshot } from './contracts';

export const RYBENA_UNAVAILABLE_MESSAGE =
  'Tradução em Libras por Rybená. Recurso aguardando liberação técnica para esta demonstração.';

const snapshot: RybenaSnapshot = {
  state: 'unavailable_pending_provider_configuration',
  mode: 'libras',
  message: RYBENA_UNAVAILABLE_MESSAGE,
  attribution: 'Tradução em Libras por Rybená',
  attributionUrl: 'https://www.rybena.com.br/',
  simulated: false,
};

const unavailableReceipt = (): RybenaReceipt => ({
  status: 'unavailable',
  state: snapshot.state,
  message: RYBENA_UNAVAILABLE_MESSAGE,
});

export class RybenaUnavailableAdapter implements RybenaAdapter {
  getSnapshot = () => snapshot;
  initialize = async () => unavailableReceipt();
  setMode = async () => unavailableReceipt();
  open = async () => unavailableReceipt();
  close = async () => unavailableReceipt();
  translate = async () => unavailableReceipt();
  pause = async () => unavailableReceipt();
  resume = async () => unavailableReceipt();
  stop = async () => unavailableReceipt();
  setSpeed = async () => unavailableReceipt();
  subscribe = () => () => undefined;
}

export const rybenaAdapter = new RybenaUnavailableAdapter();
