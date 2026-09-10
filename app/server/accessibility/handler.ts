import {
  explainRequestSchema,
  plannerRequestSchema,
  plannerResponseSchema,
  simplifyRequestSchema,
  textResponseSchema,
  type ExplainRequest,
  type PlannerRequest,
  type SimplifyRequest,
} from '../../src/features/accessibility-agent/core/contracts';
import { getConfiguredProvider, type LlmProvider } from './provider';
import {
  EXPLAIN_SYSTEM_PROMPT,
  PLANNER_SYSTEM_PROMPT,
  SIMPLIFY_SYSTEM_PROMPT,
  explainUserPrompt,
  plannerUserPrompt,
  simplifyUserPrompt,
} from './prompt';

export type AccessibilityEndpoint = 'plan' | 'explain' | 'simplify';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export const handleAccessibilityRequest = async (
  request: Request,
  endpoint: AccessibilityEndpoint,
  provider: LlmProvider | null = getConfiguredProvider(),
): Promise<Response> => {
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const parsed = endpoint === 'plan'
    ? plannerRequestSchema.safeParse(body)
    : endpoint === 'explain'
      ? explainRequestSchema.safeParse(body)
      : simplifyRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error }, 400);
  if (!provider) {
    return json({ error: 'O provedor de IA ainda não foi configurado. Os ajustes manuais continuam disponíveis.' }, 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const result = endpoint === 'plan'
      ? await provider.complete(PLANNER_SYSTEM_PROMPT, plannerUserPrompt(parsed.data as PlannerRequest), controller.signal)
      : endpoint === 'explain'
        ? await provider.complete(EXPLAIN_SYSTEM_PROMPT, explainUserPrompt(parsed.data as ExplainRequest), controller.signal)
        : await provider.complete(SIMPLIFY_SYSTEM_PROMPT, simplifyUserPrompt(parsed.data as SimplifyRequest), controller.signal);
    const output = endpoint === 'plan' ? plannerResponseSchema.safeParse(result) : textResponseSchema.safeParse(result);
    if (!output.success) return json({ error: 'O provedor retornou uma resposta fora do contrato seguro.' }, 502);
    return json(output.data);
  } catch (error) {
    const message = controller.signal.aborted
      ? 'O provedor excedeu o limite de 10 segundos.'
      : 'O provedor de IA não conseguiu responder.';
    console.error('[accessibility-agent]', error instanceof Error ? error.message : 'unknown_provider_error');
    return json({ error: message }, 502);
  } finally {
    clearTimeout(timeout);
  }
};
