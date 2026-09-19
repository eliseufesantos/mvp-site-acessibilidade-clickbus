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

/**
 * Classe do problema, para a interface escolher o texto e o tom sem reinterpretar
 * mensagem. `unavailable` = 503 honesto do servidor; `busy` = sobrecarga ou
 * limite do provedor, que passa sozinho; `rate_limited` = nossa quota por IP;
 * `contract` = a resposta não coube no contrato seguro.
 */
export type AccessibilityServiceKind =
  | 'unavailable'
  | 'busy'
  | 'rate_limited'
  | 'contract'
  | 'cancelled'
  | 'network'
  | 'failed';

export class AccessibilityServiceError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly kind: AccessibilityServiceKind = 'failed',
  ) {
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
          'busy',
        );
      }
      if (response.status === 429) {
        throw new AccessibilityServiceError(
          'Muitos pedidos em pouco tempo. Aguarde um minuto — os ajustes manuais continuam disponíveis.',
          429,
          'rate_limited',
        );
      }
      if (response.status === 503) {
        throw new AccessibilityServiceError(
          'O planejamento por IA ainda não foi configurado neste ambiente. Os ajustes manuais continuam disponíveis.',
          503,
          'unavailable',
        );
      }
      // A ressalva vai junto mesmo quando o servidor manda a própria mensagem:
      // a pessoa precisa saber que os controles manuais seguem funcionando.
      const detail = body?.error ? `${body.error} ` : 'O assistente não conseguiu responder agora. ';
      throw new AccessibilityServiceError(
        `${detail}Os ajustes manuais continuam disponíveis.`,
        response.status,
        'failed',
      );
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new AccessibilityServiceError(
        'A resposta do serviço não seguiu o contrato seguro e foi descartada. Os ajustes manuais continuam disponíveis.',
        response.status,
        'contract',
      );
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof AccessibilityServiceError) throw error;
    if (controller.signal.aborted) {
      throw new AccessibilityServiceError('A solicitação foi cancelada ou excedeu 12 segundos.', undefined, 'cancelled');
    }
    throw new AccessibilityServiceError(
      'Não foi possível acessar o serviço de IA. Os ajustes manuais continuam disponíveis.',
      undefined,
      'network',
    );
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
