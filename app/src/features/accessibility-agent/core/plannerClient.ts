import {
  explainRequestSchema,
  plannerRequestSchema,
  plannerResponseSchema,
  simplifyRequestSchema,
  textResponseSchema,
  type ExplainRequest,
  type PlannerRequest,
  type PlannerResponse,
  type SimplifyRequest,
  type TextResponse,
} from './contracts';

// Códigos que significam "tente de novo daqui a pouco", não "está quebrado".
const BUSY_PROVIDER_CODES = new Set(['provider_http_429', 'provider_http_503', 'provider_timeout']);

export class AccessibilityServiceError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export const createRequestId = () =>
  globalThis.crypto?.randomUUID?.() ?? `a11y-${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface RuntimeSchema<Value> {
  safeParse(value: unknown): { success: true; data: Value } | { success: false; error: string };
}

const postJson = async <Request, Response>(
  path: string,
  payload: Request,
  schema: RuntimeSchema<Response>,
  signal?: AbortSignal,
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null) as { error?: string; code?: string } | null;
    if (!response.ok) {
      // Sobrecarga e limite de taxa do provedor não são defeito: o servidor já
      // tentou uma segunda vez. Dizer "não conseguiu responder" faria a pessoa
      // desistir, quando esperar alguns segundos resolve.
      if (body?.code && BUSY_PROVIDER_CODES.has(body.code)) {
        throw new AccessibilityServiceError(
          'O serviço de IA está ocupado agora. Aguarde alguns segundos e peça novamente — os ajustes manuais continuam disponíveis.',
          response.status,
        );
      }
      const fallback = response.status === 503
        ? 'O planejamento por IA ainda não foi configurado. Os ajustes manuais continuam disponíveis.'
        : 'O assistente não conseguiu responder agora. Tente novamente ou use os ajustes manuais.';
      throw new AccessibilityServiceError(body?.error || fallback, response.status);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new AccessibilityServiceError('A resposta do serviço não seguiu o contrato seguro.');
    return parsed.data;
  } catch (error) {
    if (error instanceof AccessibilityServiceError) throw error;
    if (controller.signal.aborted) throw new AccessibilityServiceError('A solicitação foi cancelada ou excedeu 12 segundos.');
    throw new AccessibilityServiceError('Não foi possível acessar o serviço de IA. Os ajustes manuais continuam disponíveis.');
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
};

export const requestPlan = async (request: PlannerRequest, signal?: AbortSignal): Promise<PlannerResponse> => {
  const parsed = plannerRequestSchema.safeParse(request);
  if (!parsed.success) throw new AccessibilityServiceError(parsed.error);
  const response = await postJson('/api/accessibility/plan', parsed.data, plannerResponseSchema, signal);
  if (response.requestId !== request.requestId) throw new AccessibilityServiceError('A resposta não pertence a esta solicitação.');
  return response;
};

export const requestExplanation = async (request: ExplainRequest, signal?: AbortSignal): Promise<TextResponse> => {
  const parsed = explainRequestSchema.safeParse(request);
  if (!parsed.success) throw new AccessibilityServiceError(parsed.error);
  const response = await postJson('/api/accessibility/explain', parsed.data as ExplainRequest, textResponseSchema, signal);
  if (response.requestId !== request.requestId) throw new AccessibilityServiceError('A resposta não pertence a esta solicitação.');
  return response;
};

export const requestSimplification = async (request: SimplifyRequest, signal?: AbortSignal): Promise<TextResponse> => {
  const parsed = simplifyRequestSchema.safeParse(request);
  if (!parsed.success) throw new AccessibilityServiceError(parsed.error);
  const response = await postJson('/api/accessibility/simplify', parsed.data as SimplifyRequest, textResponseSchema, signal);
  if (response.requestId !== request.requestId) throw new AccessibilityServiceError('A resposta não pertence a esta solicitação.');
  return response;
};
