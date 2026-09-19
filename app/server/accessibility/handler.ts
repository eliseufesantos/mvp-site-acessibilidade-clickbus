import {
  PLANNER_RESPONSE_JSON_SCHEMA,
  TEXT_RESPONSE_JSON_SCHEMA,
  explainRequestSchema,
  plannerRequestSchema,
  plannerResponseSchema,
  simplifyRequestSchema,
  textResponseSchema,
  type ExplainRequest,
  type PlannerRequest,
  type SimplifyRequest,
} from '../../src/features/accessibility-agent/core/contracts.js';
import { getConfiguredProvider, type LlmProvider } from './provider.js';
import {
  EXPLAIN_SYSTEM_PROMPT,
  PLANNER_SYSTEM_PROMPT,
  SIMPLIFY_SYSTEM_PROMPT,
  explainUserPrompt,
  plannerUserPrompt,
  simplifyUserPrompt,
} from './prompt.js';

export type AccessibilityEndpoint = 'plan' | 'explain' | 'simplify';

export const MAX_ACCESSIBILITY_REQUEST_BYTES = 16 * 1024;

interface QuotaResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export interface AccessibilityRequestQuota {
  consume(request: Request): QuotaResult;
}

interface QuotaOptions {
  requestsPerMinute: number;
  requestsPerDay: number;
  now?: () => number;
}

const parsePositiveInteger = (value: string | undefined, fallback: number, maximum: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : fallback;
};

export const createAccessibilityRequestQuota = ({
  requestsPerMinute,
  requestsPerDay,
  now = Date.now,
}: QuotaOptions): AccessibilityRequestQuota => {
  const clients = new Map<string, { windowStartedAt: number; count: number }>();
  let currentDay = Math.floor(now() / 86_400_000);
  let dailyCount = 0;

  return {
    consume(request: Request): QuotaResult {
      const timestamp = now();
      const day = Math.floor(timestamp / 86_400_000);
      if (day !== currentDay) {
        currentDay = day;
        dailyCount = 0;
      }
      if (dailyCount >= requestsPerDay) {
        const retryAfterSeconds = Math.max(1, Math.ceil(((day + 1) * 86_400_000 - timestamp) / 1000));
        return { allowed: false, retryAfterSeconds };
      }

      const vercelForwarded = request.headers.get('x-vercel-forwarded-for')?.trim();
      const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
      let client = (vercelForwarded || forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown').slice(0, 100);
      let existing = clients.get(client);
      if (!existing && clients.size >= 1_000) {
        for (const [key, value] of clients) {
          if (timestamp - value.windowStartedAt >= 60_000) clients.delete(key);
        }
        if (clients.size >= 1_000) client = 'overflow';
        existing = clients.get(client);
      }
      const windowStartedAt = !existing || timestamp - existing.windowStartedAt >= 60_000
        ? timestamp
        : existing.windowStartedAt;
      const count = windowStartedAt === existing?.windowStartedAt ? existing.count : 0;
      if (count >= requestsPerMinute) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((windowStartedAt + 60_000 - timestamp) / 1000)),
        };
      }

      clients.set(client, { windowStartedAt, count: count + 1 });
      dailyCount += 1;
      return { allowed: true };
    },
  };
};

const environment = typeof process === 'undefined' ? {} : process.env;
const defaultQuota = createAccessibilityRequestQuota({
  requestsPerMinute: parsePositiveInteger(environment.ACCESSIBILITY_LLM_REQUESTS_PER_MINUTE, 12, 120),
  requestsPerDay: parsePositiveInteger(environment.ACCESSIBILITY_LLM_REQUESTS_PER_DAY, 200, 10_000),
});

const json = (body: unknown, status = 200, extraHeaders?: HeadersInit) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    'x-content-type-options': 'nosniff',
    ...Object.fromEntries(new Headers(extraHeaders)),
  },
});

const normalizeOrigin = (value: string): string | null => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
};

const isAllowedOrigin = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  const normalizedOrigin = origin ? normalizeOrigin(origin) : null;
  if (!normalizedOrigin) return false;
  if (normalizedOrigin === new URL(request.url).origin) return true;
  const configured = environment.ACCESSIBILITY_ALLOWED_ORIGINS
    ?.split(',')
    .map((value) => normalizeOrigin(value.trim()))
    .filter((value): value is string => value !== null) ?? [];
  return configured.includes(normalizedOrigin);
};

// Identificador estável de qual ramo do adaptador falhou. O adaptador lança
// `Error` com nomes fixos (`provider_http_429`, `provider_incomplete_response`,
// ...) e sem conteúdo de prompt, então expor o código é seguro e evita que seis
// falhas distintas apareçam como a mesma mensagem genérica.
const PROVIDER_ERROR_CODE = /^provider_[a-z0-9_]{1,60}$/;

const providerErrorCode = (error: unknown): string => {
  const message = error instanceof Error ? error.message : '';
  return PROVIDER_ERROR_CODE.test(message) ? message : 'provider_failed';
};

class RequestBodyTooLargeError extends Error {}

const readRequestBody = async (request: Request): Promise<string> => {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_ACCESSIBILITY_REQUEST_BYTES) {
    throw new RequestBodyTooLargeError();
  }
  if (!request.body) return '';

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let result = '';
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > MAX_ACCESSIBILITY_REQUEST_BYTES) {
      await reader.cancel();
      throw new RequestBodyTooLargeError();
    }
    result += decoder.decode(chunk.value, { stream: true });
  }
  return result + decoder.decode();
};

export const handleAccessibilityRequest = async (
  request: Request,
  endpoint: AccessibilityEndpoint,
  provider: LlmProvider | null = getConfiguredProvider(),
  quota: AccessibilityRequestQuota = defaultQuota,
): Promise<Response> => {
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  if (!isAllowedOrigin(request)) return json({ error: 'Origem não autorizada.' }, 403);
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    return json({ error: 'O corpo deve usar application/json.' }, 415);
  }

  let body: unknown;
  try {
    body = JSON.parse(await readRequestBody(request)) as unknown;
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return json({ error: 'A solicitação excede o limite de 16 KiB.' }, 413);
    }
    return json({ error: 'JSON inválido.' }, 400);
  }

  const parsed = endpoint === 'plan'
    ? plannerRequestSchema.safeParse(body)
    : endpoint === 'explain'
      ? explainRequestSchema.safeParse(body)
      : simplifyRequestSchema.safeParse(body);
  if (parsed.success === false) return json({ error: parsed.error }, 400);
  if (!provider) {
    return json({ error: 'O provedor de IA ainda não foi configurado. Os ajustes manuais continuam disponíveis.' }, 503);
  }

  const quotaResult = quota.consume(request);
  if (!quotaResult.allowed) {
    return json(
      { error: 'O limite temporário de uso da IA foi atingido. Tente novamente mais tarde.' },
      429,
      { 'retry-after': String(quotaResult.retryAfterSeconds ?? 60) },
    );
  }

  const controller = new AbortController();
  const abortFromRequest = () => controller.abort();
  request.signal.addEventListener('abort', abortFromRequest, { once: true });
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const result = endpoint === 'plan'
      ? await provider.complete(PLANNER_SYSTEM_PROMPT, plannerUserPrompt(parsed.data as PlannerRequest), controller.signal, PLANNER_RESPONSE_JSON_SCHEMA)
      : endpoint === 'explain'
        ? await provider.complete(EXPLAIN_SYSTEM_PROMPT, explainUserPrompt(parsed.data as ExplainRequest), controller.signal, TEXT_RESPONSE_JSON_SCHEMA)
        : await provider.complete(SIMPLIFY_SYSTEM_PROMPT, simplifyUserPrompt(parsed.data as SimplifyRequest), controller.signal, TEXT_RESPONSE_JSON_SCHEMA);
    const output = endpoint === 'plan' ? plannerResponseSchema.safeParse(result) : textResponseSchema.safeParse(result);
    if (!output.success) {
      return json({
        error: 'O provedor retornou uma resposta fora do contrato seguro.',
        code: 'contract_mismatch',
        detail: output.error,
      }, 502);
    }
    return json(output.data);
  } catch (error) {
    if (controller.signal.aborted) {
      return json({ error: 'O provedor excedeu o limite de 10 segundos.', code: 'provider_timeout' }, 502);
    }
    return json({ error: 'O provedor de IA não conseguiu responder.', code: providerErrorCode(error) }, 502);
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', abortFromRequest);
  }
};
