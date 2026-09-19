import type { AccessibilityPreferences } from '../../../types.js';
import {
  COLOR_FILTERS,
  LIBRAS_SPEEDS,
  LINE_HEIGHTS,
  PREFERENCE_KEYS,
  SATURATIONS,
  TEXT_ALIGNS,
  TEXT_SCALES,
  parsePreferencePatch,
  type PreferencePatch,
} from './preferences.js';

/**
 * 2.2 acrescentou as ações de conteúdo, para que um único chat atenda tanto
 * "aumente o texto" quanto "o que é viação". O roteamento continua vindo do
 * plano: o cliente não adivinha a intenção por texto.
 *
 * 2.1 acrescentou as ações de voz. O contrato não tem artefato persistido — as
 * preferências ficam em `clickbus-a11y-v3`, versionadas à parte —, então a
 * "migração" é simplesmente rejeitar o que não é desta versão: tanto o servidor
 * quanto o executor local revalidam `contractVersion` antes de qualquer efeito,
 * e um plano 2.0 em voo é descartado em vez de aplicado pela metade.
 */
export const CONTRACT_VERSION = '2.2' as const;

export type ActionType =
  | 'set_preferences'
  | 'apply_comfortable_reading'
  | 'undo_preferences'
  | 'reset_preferences'
  | 'open_libras'
  | 'close_libras'
  | 'translate_content'
  | 'pause_libras'
  | 'resume_libras'
  | 'stop_libras'
  | 'set_libras_speed'
  // Voz: mesmo player, outro modo. As famílias são separadas para que o
  // planejador expresse a intenção da pessoa e para que a capacidade de voz
  // possa faltar sem derrubar Libras.
  | 'open_voice'
  | 'close_voice'
  | 'speak_content'
  | 'pause_voice'
  | 'resume_voice'
  | 'stop_voice'
  // Conteúdo: respondem com texto em vez de alterar a tela. O executor tenta o
  // glossário e a simplificação local antes de qualquer chamada de rede.
  | 'explain_term'
  | 'simplify_content';

export type PlanAction =
  | { type: 'set_preferences'; patch: PreferencePatch }
  | { type: 'apply_comfortable_reading' }
  | { type: 'undo_preferences' }
  | { type: 'reset_preferences' }
  | { type: 'open_libras' }
  | { type: 'close_libras' }
  | { type: 'translate_content'; contentRef: string }
  | { type: 'pause_libras' }
  | { type: 'resume_libras' }
  | { type: 'stop_libras' }
  | { type: 'set_libras_speed'; speed: AccessibilityPreferences['librasSpeed'] }
  | { type: 'open_voice' }
  | { type: 'close_voice' }
  | { type: 'speak_content'; contentRef: string }
  | { type: 'pause_voice' }
  | { type: 'resume_voice' }
  | { type: 'stop_voice' }
  | { type: 'explain_term'; term: string }
  | { type: 'simplify_content'; contentRef: string };

export interface ContentTargetMeta {
  id: string;
  label: string;
}

export interface PlannerContext {
  stateRevision: number;
  pageEpoch: number;
  panelSession: number;
  canUndo: boolean;
  librasState: string;
  preferences: AccessibilityPreferences;
  capabilities: ActionType[];
  contentTargets: ContentTargetMeta[];
}

export interface PlannerRequest {
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  message: string;
  context: PlannerContext;
  history: { role: 'user' | 'assistant'; content: string }[];
}

export interface PlannerResponse {
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  planId: string;
  baseStateRevision: number;
  pageEpoch: number;
  panelSession: number;
  mode: 'apply' | 'propose' | 'clarify' | 'unsupported';
  message: string;
  actions: PlanAction[];
}

export interface ExplainRequest {
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  term: string;
  context: string;
  contentRef: string;
}

export interface SimplifyRequest {
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  text: string;
  contentRef: string;
}

export interface TextResponse {
  contractVersion: typeof CONTRACT_VERSION;
  requestId: string;
  text: string;
}

type SchemaResult<Value> = { success: true; data: Value } | { success: false; error: string };

const ok = <Value>(data: Value): SchemaResult<Value> => ({ success: true, data });
const fail = <Value>(error: string): SchemaResult<Value> => ({ success: false, error });
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).every((key) => keys.includes(key));
const isInteger = (value: unknown) => Number.isInteger(value) && Number(value) >= 0;
const isShortString = (value: unknown, max: number, min = 1) =>
  typeof value === 'string' && value.trim().length >= min && value.length <= max;

const actionTypes: readonly ActionType[] = [
  'set_preferences', 'apply_comfortable_reading', 'undo_preferences', 'reset_preferences',
  'open_libras', 'close_libras', 'translate_content', 'pause_libras', 'resume_libras',
  'stop_libras', 'set_libras_speed',
  'open_voice', 'close_voice', 'speak_content', 'pause_voice', 'resume_voice', 'stop_voice',
  'explain_term', 'simplify_content',
];

/** Ações que exigem um `contentRef` de `context.contentTargets`. */
export const CONTENT_BOUND_ACTIONS = ['translate_content', 'speak_content', 'simplify_content'] as const;

/** Ações que respondem com texto e não alteram a página. */
export const TEXT_ANSWER_ACTIONS = ['explain_term', 'simplify_content'] as const;

const parsePreferences = (value: unknown): AccessibilityPreferences | null => {
  if (!isRecord(value) || Object.keys(value).length !== PREFERENCE_KEYS.length) return null;
  const patch = parsePreferencePatch(value);
  return patch as AccessibilityPreferences | null;
};

export const parsePlanAction = (value: unknown): PlanAction | null => {
  if (!isRecord(value) || typeof value.type !== 'string' || !actionTypes.includes(value.type as ActionType)) return null;
  if (value.type === 'set_preferences') {
    if (!hasOnlyKeys(value, ['type', 'patch'])) return null;
    const patch = parsePreferencePatch(value.patch);
    return patch ? { type: 'set_preferences', patch } : null;
  }
  if (value.type === 'translate_content' || value.type === 'speak_content' || value.type === 'simplify_content') {
    return hasOnlyKeys(value, ['type', 'contentRef']) && isShortString(value.contentRef, 100)
      ? { type: value.type, contentRef: value.contentRef as string } as PlanAction : null;
  }
  if (value.type === 'explain_term') {
    // O mesmo teto de `explainRequestSchema`, para o plano não propor um termo
    // que o endpoint de explicação recusaria depois.
    return hasOnlyKeys(value, ['type', 'term']) && isShortString(value.term, 120)
      ? { type: 'explain_term', term: value.term as string } : null;
  }
  if (value.type === 'set_libras_speed') {
    return hasOnlyKeys(value, ['type', 'speed']) && LIBRAS_SPEEDS.includes(value.speed as never)
      ? { type: 'set_libras_speed', speed: value.speed as AccessibilityPreferences['librasSpeed'] } : null;
  }
  return hasOnlyKeys(value, ['type']) ? value as PlanAction : null;
};

const validateActions = (actions: unknown, mode: PlannerResponse['mode']): PlanAction[] | null => {
  if (!Array.isArray(actions) || actions.length > 3) return null;
  const parsed = actions.map(parsePlanAction);
  if (parsed.some((action) => action === null)) return null;
  const valid = parsed as PlanAction[];
  if ((mode === 'clarify' || mode === 'unsupported') && valid.length > 0) return null;
  const types = valid.map((action) => action.type);
  if (new Set(types).size !== types.length) return null;
  if ((types.includes('undo_preferences') || types.includes('reset_preferences')) && types.length !== 1) return null;
  return valid;
};

export const plannerResponseSchema = {
  safeParse(value: unknown): SchemaResult<PlannerResponse> {
    if (!isRecord(value) || !hasOnlyKeys(value, [
      'contractVersion', 'requestId', 'planId', 'baseStateRevision', 'pageEpoch',
      'panelSession', 'mode', 'message', 'actions',
    ])) return fail('Plano com campos inválidos.');
    const mode = value.mode;
    if (!['apply', 'propose', 'clarify', 'unsupported'].includes(String(mode))) return fail('Modo inválido.');
    const actions = validateActions(value.actions, mode as PlannerResponse['mode']);
    if (
      value.contractVersion !== CONTRACT_VERSION || !isShortString(value.requestId, 100) ||
      !isShortString(value.planId, 100) || !isInteger(value.baseStateRevision) ||
      !isInteger(value.pageEpoch) || !isInteger(value.panelSession) ||
      !isShortString(value.message, 800) || !actions
    ) return fail('Plano fora do contrato.');
    return ok({ ...value, mode, actions } as PlannerResponse);
  },
};

export const plannerRequestSchema = {
  safeParse(value: unknown): SchemaResult<PlannerRequest> {
    if (!isRecord(value) || !hasOnlyKeys(value, ['contractVersion', 'requestId', 'message', 'context', 'history'])) {
      return fail('Solicitação com campos inválidos.');
    }
    if (value.contractVersion !== CONTRACT_VERSION || !isShortString(value.requestId, 100) || !isShortString(value.message, 1000)) {
      return fail('Solicitação fora do contrato.');
    }
    if (!isRecord(value.context) || !hasOnlyKeys(value.context, [
      'stateRevision', 'pageEpoch', 'panelSession', 'canUndo', 'librasState',
      'preferences', 'capabilities', 'contentTargets',
    ])) return fail('Contexto inválido.');
    const context = value.context;
    const preferences = parsePreferences(context.preferences);
    if (
      !isInteger(context.stateRevision) || !isInteger(context.pageEpoch) || !isInteger(context.panelSession) ||
      typeof context.canUndo !== 'boolean' || !isShortString(context.librasState, 100) || !preferences ||
      !Array.isArray(context.capabilities) || context.capabilities.some((item) => !actionTypes.includes(item as ActionType)) ||
      !Array.isArray(context.contentTargets) || context.contentTargets.length > 12 ||
      context.contentTargets.some((item) => !isRecord(item) || !hasOnlyKeys(item, ['id', 'label']) ||
        !isShortString(item.id, 100) || !isShortString(item.label, 100))
    ) return fail('Contexto fora do contrato.');
    if (!Array.isArray(value.history) || value.history.length > 6 || value.history.some((item) =>
      !isRecord(item) || !hasOnlyKeys(item, ['role', 'content']) ||
      !['user', 'assistant'].includes(String(item.role)) || !isShortString(item.content, 800)
    )) return fail('Histórico inválido.');
    return ok(value as unknown as PlannerRequest);
  },
};

const validateTextEndpoint = (
  value: unknown,
  kind: 'explain' | 'simplify',
): SchemaResult<ExplainRequest | SimplifyRequest> => {
  const keys = kind === 'explain'
    ? ['contractVersion', 'requestId', 'term', 'context', 'contentRef']
    : ['contractVersion', 'requestId', 'text', 'contentRef'];
  if (!isRecord(value) || !hasOnlyKeys(value, keys) || value.contractVersion !== CONTRACT_VERSION ||
    !isShortString(value.requestId, 100) || !isShortString(value.contentRef, 100)) return fail('Entrada inválida.');
  if (kind === 'explain') {
    if (!isShortString(value.term, 120) || typeof value.context !== 'string' || value.context.length > 500) return fail('Termo inválido.');
  } else if (!isShortString(value.text, 1500)) return fail('Trecho inválido.');
  return ok(value as unknown as ExplainRequest | SimplifyRequest);
};

export const explainRequestSchema = { safeParse: (value: unknown) => validateTextEndpoint(value, 'explain') };
export const simplifyRequestSchema = { safeParse: (value: unknown) => validateTextEndpoint(value, 'simplify') };

export const textResponseSchema = {
  safeParse(value: unknown): SchemaResult<TextResponse> {
    if (!isRecord(value) || !hasOnlyKeys(value, ['contractVersion', 'requestId', 'text']) ||
      value.contractVersion !== CONTRACT_VERSION || !isShortString(value.requestId, 100) ||
      !isShortString(value.text, 2000)) return fail('Resposta textual inválida.');
    return ok(value as unknown as TextResponse);
  },
};

export const ALL_ACTION_TYPES = actionTypes;

// Esquemas de saída estruturada enviados ao provedor.
//
// São derivados das mesmas constantes que os validadores acima para não
// divergirem. Eles orientam o modelo, mas NÃO substituem a validação: o
// servidor revalida com `plannerResponseSchema`/`textResponseSchema` e o
// executor local revalida de novo antes de aplicar qualquer efeito.
//
// A combinação exata de chaves por tipo de ação continua sendo responsabilidade
// de `parsePlanAction`, porque o suporte a `anyOf` na saída estruturada varia
// entre provedores e um esquema rejeitado derrubaria a chamada inteira.

const preferencePatchJsonSchema = {
  type: 'object',
  description: 'Somente as chaves que devem mudar. Nunca envie o objeto completo.',
  properties: {
    contrast: { type: 'string', enum: ['default', 'high'] },
    textScale: { type: 'number', enum: [...TEXT_SCALES] },
    controlSize: { type: 'string', enum: ['default', 'large'] },
    cursor: { type: 'string', enum: ['default', 'large'] },
    highlightLinks: { type: 'boolean' },
    highlightHeadings: { type: 'boolean' },
    letterSpacing: { type: 'string', enum: ['default', 'wide'] },
    lineHeight: { type: 'string', enum: [...LINE_HEIGHTS] },
    textAlign: { type: 'string', enum: [...TEXT_ALIGNS] },
    readingGuide: { type: 'boolean' },
    readingMask: { type: 'boolean' },
    reducedMotion: { type: 'boolean' },
    saturation: { type: 'string', enum: [...SATURATIONS] },
    colorFilter: { type: 'string', enum: [...COLOR_FILTERS] },
    dyslexiaFont: { type: 'boolean' },
    librasSpeed: { type: 'number', enum: [...LIBRAS_SPEEDS] },
  },
  additionalProperties: false,
} as const;

const planActionJsonSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: [...actionTypes] },
    patch: {
      ...preferencePatchJsonSchema,
      description: 'Obrigatório e exclusivo de set_preferences.',
    },
    contentRef: {
      type: 'string',
      description: 'Obrigatório e exclusivo de translate_content, speak_content e simplify_content. Use um id de context.contentTargets.',
    },
    term: {
      type: 'string',
      description: 'Obrigatório e exclusivo de explain_term. A palavra ou expressão que a pessoa quer entender.',
    },
    speed: {
      type: 'number',
      enum: [...LIBRAS_SPEEDS],
      description: 'Obrigatório e exclusivo de set_libras_speed.',
    },
  },
  required: ['type'],
  additionalProperties: false,
} as const;

export const PLANNER_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    contractVersion: { type: 'string', enum: [CONTRACT_VERSION] },
    requestId: { type: 'string', description: 'Copie exatamente o requestId do pedido.' },
    planId: { type: 'string', description: 'Identificador curto e único deste plano.' },
    baseStateRevision: { type: 'integer', description: 'Copie exatamente context.stateRevision do pedido.' },
    pageEpoch: { type: 'integer', description: 'Copie exatamente context.pageEpoch do pedido.' },
    panelSession: { type: 'integer', description: 'Copie exatamente context.panelSession do pedido.' },
    mode: { type: 'string', enum: ['apply', 'propose', 'clarify', 'unsupported'] },
    message: { type: 'string', description: 'Resposta curta em português brasileiro para a pessoa usuária.' },
    actions: {
      type: 'array',
      maxItems: 3,
      description: 'Vazio quando mode for clarify ou unsupported. Sem tipos repetidos.',
      items: planActionJsonSchema,
    },
  },
  required: [
    'contractVersion', 'requestId', 'planId', 'baseStateRevision',
    'pageEpoch', 'panelSession', 'mode', 'message', 'actions',
  ],
  additionalProperties: false,
} as const;

export const TEXT_RESPONSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    contractVersion: { type: 'string', enum: [CONTRACT_VERSION] },
    requestId: { type: 'string', description: 'Copie exatamente o requestId do pedido.' },
    text: { type: 'string', description: 'Resposta em português brasileiro simples.' },
  },
  required: ['contractVersion', 'requestId', 'text'],
  additionalProperties: false,
} as const;
