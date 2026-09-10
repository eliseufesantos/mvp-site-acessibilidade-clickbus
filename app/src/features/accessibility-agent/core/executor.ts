import type { AccessibilityPreferences } from '../../../types';
import type { LibrasAdapter } from '../adapters/libras/contracts';
import { COMFORTABLE_READING_PATCH, type PreferencePatch } from './preferences';
import {
  plannerResponseSchema,
  type ActionType,
  type PlanAction,
  type PlannerResponse,
} from './contracts';

export type ActionReceiptStatus = 'applied' | 'no_change' | 'failed' | 'skipped';

export interface ActionReceipt {
  action: ActionType;
  status: ActionReceiptStatus;
  message: string;
}

export interface ExecutionReceipt {
  planId: string;
  status: 'applied' | 'partial' | 'no_change' | 'rejected';
  actions: ActionReceipt[];
  finalStateRevision: number;
}

export interface ExecutorDependencies {
  requestId: string;
  getStateRevision(): number;
  getPageEpoch(): number;
  getPanelSession(): number;
  getPreferences(): AccessibilityPreferences;
  applyPreferences(patch: PreferencePatch): boolean;
  undoPreferences(): boolean;
  resetPreferences(): boolean;
  resolveContent(id: string): { id: string; text: string } | null;
  libras: LibrasAdapter;
  capabilities: readonly ActionType[];
}

export class PlanExecutionError extends Error {}

const visualMessage = (action: PlanAction, changed: boolean) => {
  if (!changed) return 'O ajuste já estava nesse estado.';
  if (action.type === 'set_preferences') return 'Preferências atualizadas.';
  if (action.type === 'apply_comfortable_reading') return 'Leitura confortável aplicada.';
  if (action.type === 'undo_preferences') return 'Último ajuste desfeito.';
  return 'Aparência padrão restaurada.';
};

export class AccessibilityExecutor {
  private receipts = new Map<string, ExecutionReceipt>();

  async execute(value: unknown, dependencies: ExecutorDependencies): Promise<ExecutionReceipt> {
    const parsed = plannerResponseSchema.safeParse(value);
    if (!parsed.success) throw new PlanExecutionError(parsed.error);
    const plan = parsed.data;
    const previous = this.receipts.get(plan.planId);
    if (previous) return previous;
    if (plan.requestId !== dependencies.requestId) throw new PlanExecutionError('A resposta não pertence a esta solicitação.');
    if (
      plan.baseStateRevision !== dependencies.getStateRevision() ||
      plan.pageEpoch !== dependencies.getPageEpoch() ||
      plan.panelSession !== dependencies.getPanelSession()
    ) throw new PlanExecutionError('A página ou as preferências mudaram. Faça o pedido novamente.');

    const preparedContent = new Map<string, { id: string; text: string }>();
    for (const action of plan.actions) {
      if (!dependencies.capabilities.includes(action.type)) throw new PlanExecutionError('O plano pediu uma capacidade indisponível.');
      if (action.type === 'translate_content') {
        const content = dependencies.resolveContent(action.contentRef);
        if (!content || content.text.length > 1500) throw new PlanExecutionError('O trecho não está disponível nesta página.');
        preparedContent.set(action.contentRef, content);
      }
    }

    const actions: ActionReceipt[] = [];
    for (const action of plan.actions) {
      if (action.type === 'set_preferences' || action.type === 'apply_comfortable_reading' ||
        action.type === 'undo_preferences' || action.type === 'reset_preferences') {
        const changed = action.type === 'set_preferences'
          ? dependencies.applyPreferences(action.patch)
          : action.type === 'apply_comfortable_reading'
            ? dependencies.applyPreferences(COMFORTABLE_READING_PATCH)
            : action.type === 'undo_preferences'
              ? dependencies.undoPreferences()
              : dependencies.resetPreferences();
        actions.push({ action: action.type, status: changed ? 'applied' : 'no_change', message: visualMessage(action, changed) });
        continue;
      }

      const result = action.type === 'open_libras' ? await dependencies.libras.open()
        : action.type === 'close_libras' ? await dependencies.libras.close()
          : action.type === 'pause_libras' ? await dependencies.libras.pause()
            : action.type === 'resume_libras' ? await dependencies.libras.resume()
              : action.type === 'stop_libras' ? await dependencies.libras.stop()
                : action.type === 'set_libras_speed' ? await dependencies.libras.setSpeed(action.speed)
                  : await dependencies.libras.translate(preparedContent.get(action.contentRef)!);
      actions.push({
        action: action.type,
        status: result.status === 'accepted' ? 'applied' : 'failed',
        message: result.message,
      });
    }

    const applied = actions.filter((item) => item.status === 'applied').length;
    const failed = actions.filter((item) => item.status === 'failed').length;
    const receipt: ExecutionReceipt = {
      planId: plan.planId,
      status: failed > 0 && applied > 0 ? 'partial' : failed > 0 ? 'rejected' : applied > 0 ? 'applied' : 'no_change',
      actions,
      finalStateRevision: dependencies.getStateRevision(),
    };
    this.receipts.set(plan.planId, receipt);
    return receipt;
  }
}

export const formatExecutionReceipt = (receipt: ExecutionReceipt) =>
  receipt.actions.map((item) => item.message).filter((message, index, all) => all.indexOf(message) === index).join(' ');
