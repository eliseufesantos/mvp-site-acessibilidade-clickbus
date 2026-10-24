import { CONTRACT_VERSION, type PlannerRequest, type PlannerResponse } from '../core/contracts';
import { getDefaultPreferences } from '../core/preferences';

/**
 * Corpos válidos do contrato, compartilhados entre os arquivos de teste.
 *
 * Cada teste parte de um pedido e de uma resposta que o validador aceita e
 * altera só o que está sob exame — assim uma falha aponta para a mudança, e não
 * para um fixture montado à mão que por acaso ficou fora do contrato.
 */
export const plannerRequestBody = (requestId = 'request-test'): PlannerRequest => ({
  contractVersion: CONTRACT_VERSION,
  requestId,
  message: 'Aumente o texto',
  context: {
    stateRevision: 0,
    pageEpoch: 1,
    panelSession: 1,
    canUndo: false,
    librasState: 'unavailable_pending_provider_configuration',
    preferences: getDefaultPreferences(),
    capabilities: ['set_preferences'],
    contentTargets: [],
  },
  history: [],
});

export const plannerResponseBody = (requestId = 'request-test'): PlannerResponse => ({
  contractVersion: CONTRACT_VERSION,
  requestId,
  planId: 'plan-test',
  baseStateRevision: 0,
  pageEpoch: 1,
  panelSession: 1,
  mode: 'apply',
  message: 'Texto aumentado.',
  actions: [{ type: 'set_preferences', patch: { textScale: 1.25 } }],
});

/** Resposta HTTP com corpo JSON, como o `fetch` real devolveria. */
export const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
});
