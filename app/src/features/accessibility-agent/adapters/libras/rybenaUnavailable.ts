import type { LibrasAdapter, LibrasReceipt, LibrasSnapshot } from './contracts';

export const RYBENA_UNAVAILABLE_MESSAGE =
  'Tradução em Libras por Rybená. Recurso aguardando liberação técnica para esta demonstração.';

const snapshot: LibrasSnapshot = {
  state: 'unavailable_pending_provider_configuration',
  message: RYBENA_UNAVAILABLE_MESSAGE,
  attribution: 'Tradução em Libras por Rybená',
  attributionUrl: 'https://www.rybena.com.br/',
};

const unavailableReceipt = (): LibrasReceipt => ({
  status: 'unavailable',
  state: snapshot.state,
  message: RYBENA_UNAVAILABLE_MESSAGE,
});

export class RybenaUnavailableAdapter implements LibrasAdapter {
  getSnapshot = () => snapshot;
  initialize = async () => unavailableReceipt();
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
