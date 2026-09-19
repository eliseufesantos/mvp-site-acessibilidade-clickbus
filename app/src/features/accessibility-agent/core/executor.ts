import type { AccessibilityPreferences } from '../../../types';
import type { RybenaAdapter, RybenaMode, RybenaReceipt } from '../adapters/libras/contracts';
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
  rybena: RybenaAdapter;
  capabilities: readonly ActionType[];
}

/**
 * Ações de voz e de Libras acionam o MESMO player, em modos diferentes.
 *
 * Entrada (`open_*`, `translate_content`, `speak_content`) troca o modo antes
 * de agir. Transporte (`pause_*`, `resume_*`, `stop_*`) só age quando o player
 * já está no modo pedido — assim "pausa a narração" nunca pausa, em silêncio,
 * uma tradução em Libras. Fechar vale para os dois modos.
 *
 * O executor nunca chama os métodos visuais da Rybená: `RybenaAdapter` não os
 * declara, e os ajustes visuais são responsabilidade exclusiva do executor
 * local. Se os dois aplicarem, os efeitos somam e quebram — seção 7.4 do plano.
 */
const VOICE_ACTIONS: readonly ActionType[] = [
  'open_voice', 'close_voice', 'speak_content', 'pause_voice', 'resume_voice', 'stop_voice',
];

const ENTRY_ACTIONS: readonly ActionType[] = [
  'open_libras', 'translate_content', 'open_voice', 'speak_content',
];

const TRANSPORT_ACTIONS: readonly ActionType[] = [
  'pause_libras', 'resume_libras', 'stop_libras', 'pause_voice', 'resume_voice', 'stop_voice',
];

const modeOf = (action: ActionType): RybenaMode => (VOICE_ACTIONS.includes(action) ? 'voz' : 'libras');

const wrongModeReceipt = (wanted: RybenaMode, current: RybenaMode): RybenaReceipt => ({
  status: 'failed',
  state: 'ready',
  message: wanted === 'voz'
    ? `O player está em ${current === 'libras' ? 'Libras' : 'voz'}. Peça a narração de um trecho antes de controlá-la.`
    : `O player está em ${current === 'voz' ? 'voz' : 'Libras'}. Peça a tradução de um trecho antes de controlá-la.`,
});

export class PlanExecutionError extends Error {}

const visualMessage = (action: PlanAction, changed: boolean) => {
  if (!changed) return 'O ajuste já estava nesse estado.';
  if (action.type === 'set_preferences') return 'Preferências atualizadas.';
  if (action.type === 'apply_comfortable_reading') return 'Leitura confortável aplicada.';
  if (action.type === 'undo_preferences') return 'Último ajuste desfeito.';
  return 'Aparência padrão restaurada.';
};

// A idempotência só precisa alcançar planos recentes: um plano antigo não
// sobrevive à mudança de `stateRevision`, `pageEpoch` ou `panelSession`, que é
// revalidada antes de qualquer efeito. Sem teto, o mapa crescia por toda a
// sessão, um registro por plano.
const MAX_REMEMBERED_RECEIPTS = 50;

export class AccessibilityExecutor {
  private receipts = new Map<string, ExecutionReceipt>();

  private remember(planId: string, receipt: ExecutionReceipt) {
    this.receipts.set(planId, receipt);
    while (this.receipts.size > MAX_REMEMBERED_RECEIPTS) {
      const oldest = this.receipts.keys().next();
      if (oldest.done) break;
      this.receipts.delete(oldest.value);
    }
  }

  private async runPlayerAction(
    action: PlanAction,
    dependencies: ExecutorDependencies,
    preparedContent: Map<string, { id: string; text: string }>,
  ): Promise<RybenaReceipt> {
    const { rybena } = dependencies;

    if (action.type === 'set_libras_speed') return rybena.setSpeed(action.speed);
    if (action.type === 'close_libras' || action.type === 'close_voice') return rybena.close();

    const wanted = modeOf(action.type);
    if (ENTRY_ACTIONS.includes(action.type)) {
      const switched = await rybena.setMode(wanted);
      if (switched.status !== 'accepted') return switched;
    } else if (TRANSPORT_ACTIONS.includes(action.type)) {
      const current = rybena.getSnapshot().mode;
      if (current !== wanted) return wrongModeReceipt(wanted, current);
    }

    if (action.type === 'open_libras' || action.type === 'open_voice') return rybena.open();
    if (action.type === 'pause_libras' || action.type === 'pause_voice') return rybena.pause();
    if (action.type === 'resume_libras' || action.type === 'resume_voice') return rybena.resume();
    if (action.type === 'stop_libras' || action.type === 'stop_voice') return rybena.stop();
    if (action.type === 'translate_content' || action.type === 'speak_content') {
      return rybena.translate(preparedContent.get(action.contentRef)!);
    }
    // Inalcançável: o esquema já rejeitou qualquer outro tipo. Fica como recusa
    // explícita em vez de efeito silencioso.
    return { status: 'failed', state: 'ready', message: 'Ação de player não reconhecida.' };
  }

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
      if (action.type === 'translate_content' || action.type === 'speak_content') {
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

      const result = await this.runPlayerAction(action, dependencies, preparedContent);
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
    this.remember(plan.planId, receipt);
    return receipt;
  }
}

export const formatExecutionReceipt = (receipt: ExecutionReceipt) =>
  receipt.actions.map((item) => item.message).filter((message, index, all) => all.indexOf(message) === index).join(' ');
