import type { AccessibilityPreferences } from '../../../types.js';
import { LIBRAS_SPEEDS, PREFERENCE_KEYS, parsePreferencePatch, type PreferencePatch } from './preferences.js';

export const CONTRACT_VERSION = '2.0' as const;

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
  | 'set_libras_speed';

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
  | { type: 'set_libras_speed'; speed: AccessibilityPreferences['librasSpeed'] };

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
];

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
  if (value.type === 'translate_content') {
    return hasOnlyKeys(value, ['type', 'contentRef']) && isShortString(value.contentRef, 100)
      ? { type: 'translate_content', contentRef: value.contentRef as string } : null;
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
