import type { AccessibilityPreferences } from '../../../types';
import type { LibrasAdapter } from '../adapters/libras/contracts';
import { RybenaUnavailableAdapter, RYBENA_UNAVAILABLE_MESSAGE } from '../adapters/libras/rybenaUnavailable';
import {
  clearRememberedApprovedPageSelection,
  getApprovedPageSelection,
  getPublicContentTargets,
  rememberApprovedPageSelection,
  resolvePublicContent,
  simplifyPublicContent,
} from '../adapters/clickbus/content';
import { CONTRACT_VERSION, plannerResponseSchema, type PlannerResponse } from '../core/contracts';
import { AccessibilityExecutor, PlanExecutionError } from '../core/executor';
import { explainFromGlossary } from '../core/glossary';
import {
  COMFORTABLE_READING_PATCH,
  applyPreferencePatch,
  getDefaultPreferences,
  loadPreferences,
  parsePreferencePatch,
  serializePreferences,
  type StorageLike,
} from '../core/preferences';
import { handleAccessibilityRequest } from '../../../../server/accessibility/handler';

let passed = 0;
const test = async (name: string, run: () => void | Promise<void>) => {
  try {
    await run();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
};
const assert: (condition: unknown, message?: string) => asserts condition = (condition, message = 'assertion failed') => {
  if (!condition) throw new Error(message);
};
const equal = (actual: unknown, expected: unknown) =>
  assert(JSON.stringify(actual) === JSON.stringify(expected), `expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

await test('migrates flat v2 preferences without coupling letter and line controls afterward', () => {
  const storage = new MemoryStorage();
  storage.setItem('clickbus-a11y-v2', JSON.stringify({ highContrast: true, textScale: 1.25, comfortableSpacing: true, largeControls: true, readingGuide: true, reducedMotion: false, librasSpeed: 0.75 }));
  const loaded = loadPreferences(storage);
  assert(loaded.migratedFrom === 2);
  assert(loaded.preferences.contrast === 'high');
  assert(loaded.preferences.letterSpacing === 'wide');
  assert(loaded.preferences.lineHeight === 'comfortable');
  const next = applyPreferencePatch(loaded.preferences, { letterSpacing: 'default' });
  assert(next?.lineHeight === 'comfortable');
});

await test('migrates legacy v1 elderly mode', () => {
  const storage = new MemoryStorage();
  storage.setItem('clickbus-a11y-v1', JSON.stringify({ elderlyMode: true, highContrast: true }));
  const loaded = loadPreferences(storage);
  assert(loaded.migratedFrom === 1);
  assert(loaded.preferences.textScale === 1.125 && loaded.preferences.controlSize === 'large');
});

await test('falls back safely on invalid storage and serializes v3', () => {
  const storage = new MemoryStorage();
  storage.setItem('clickbus-a11y-v3', '{bad json');
  equal(loadPreferences(storage).preferences, getDefaultPreferences());
  const encoded = serializePreferences({ ...getDefaultPreferences(), cursor: 'large' });
  assert(encoded.includes('"version":3') && encoded.includes('"cursor":"large"'));
});

await test('rejects unknown and invalid preference values', () => {
  assert(parsePreferencePatch({ madeUp: true }) === null);
  assert(parsePreferencePatch({ textScale: 3 }) === null);
});

await test('comfortable preset preserves independent preferences', () => {
  const current = { ...getDefaultPreferences(), contrast: 'high' as const, readingGuide: true };
  const next = applyPreferencePatch(current, COMFORTABLE_READING_PATCH);
  assert(next?.contrast === 'high' && next.readingGuide && next.textAlign === 'left');
});

await test('planner schema rejects unknown actions and fields', () => {
  const invalid = plannerResponseSchema.safeParse({ contractVersion: CONTRACT_VERSION, requestId: 'r', planId: 'p', baseStateRevision: 0, pageEpoch: 1, panelSession: 1, mode: 'apply', message: 'x', actions: [{ type: 'buy_ticket' }] });
  assert(!invalid.success);
});

await test('executor validates revision and applies each plan only once', async () => {
  let preferences: AccessibilityPreferences = getDefaultPreferences();
  let revision = 0;
  let applications = 0;
  const libras = new RybenaUnavailableAdapter();
  const executor = new AccessibilityExecutor();
  const dependencies = {
    requestId: 'request-1',
    getStateRevision: () => revision,
    getPageEpoch: () => 3,
    getPanelSession: () => 2,
    getPreferences: () => preferences,
    applyPreferences: (patch: Partial<AccessibilityPreferences>) => {
      const next = applyPreferencePatch(preferences, patch);
      if (!next) return false;
      preferences = next;
      revision += 1;
      applications += 1;
      return true;
    },
    undoPreferences: () => false,
    resetPreferences: () => false,
    resolveContent: () => null,
    libras: libras as LibrasAdapter,
    capabilities: ['set_preferences'] as const,
  };
  const plan: PlannerResponse = { contractVersion: CONTRACT_VERSION, requestId: 'request-1', planId: 'plan-1', baseStateRevision: 0, pageEpoch: 3, panelSession: 2, mode: 'apply', message: 'Aplicar', actions: [{ type: 'set_preferences', patch: { contrast: 'high' } }] };
  const first = await executor.execute(plan, dependencies);
  const second = await executor.execute(plan, dependencies);
  assert(first.status === 'applied' && second.planId === first.planId && applications === 1);
  const stale = { ...plan, planId: 'plan-2', baseStateRevision: 0 };
  let rejected = false;
  try { await executor.execute(stale, dependencies); } catch (error) { rejected = error instanceof PlanExecutionError; }
  assert(rejected, 'stale plan should be rejected');
});

await test('Rybená adapter stays unavailable without network behavior', async () => {
  const adapter: LibrasAdapter = new RybenaUnavailableAdapter();
  const receipt = await adapter.translate({ id: 'search-help', text: 'Ajuda' });
  assert(receipt.status === 'unavailable' && receipt.message === RYBENA_UNAVAILABLE_MESSAGE);
});

await test('content adapter excludes checkout and confirmation', () => {
  assert(getPublicContentTargets('checkout').length === 0);
  assert(getPublicContentTargets('confirmation').length === 0);
  assert(resolvePublicContent('search', 'search-help')?.allowSimplify === true);
  assert(resolvePublicContent('search', 'unknown') === null);
});

await test('content adapter simplifies only reviewed public targets locally', () => {
  const simplified = simplifyPublicContent('search', 'search-help');
  assert(simplified?.includes('selecione Buscar passagens'));
  assert(simplified !== resolvePublicContent('search', 'search-help')?.text);
  assert(simplifyPublicContent('search', 'unknown') === null);
  assert(simplifyPublicContent('checkout', 'search-help') === null);
  assert(simplifyPublicContent('confirmation', 'search-help') === null);
});

await test('content adapter remembers a collapsed approved selection and rejects other targets', () => {
  const selection = (term: string, startId: string, endId = startId) => {
    const target = (id: string): HTMLElement => {
      let element: HTMLElement;
      element = {
        nodeType: 1,
        dataset: { a11yContentId: id },
        closest: () => element,
      } as unknown as HTMLElement;
      return element;
    };
    const targetElement = target(startId);
    const endElement = endId === startId ? targetElement : target(endId);
    return {
      rangeCount: 1,
      isCollapsed: false,
      toString: () => term,
      getRangeAt: () => ({ startContainer: targetElement, endContainer: endElement }),
    } as unknown as Selection;
  };
  const collapsed = { rangeCount: 0, isCollapsed: true } as unknown as Selection;

  clearRememberedApprovedPageSelection();
  equal(rememberApprovedPageSelection('results', selection('embarque', 'results-help')), {
    term: 'embarque',
    contentRef: 'results-help',
  });
  equal(getApprovedPageSelection('results', collapsed), { term: 'embarque', contentRef: 'results-help' });
  assert(getApprovedPageSelection('search', collapsed) === null);
  assert(getApprovedPageSelection('results', selection('texto', 'results-help', 'service-class-help')) === null);
  assert(getApprovedPageSelection('results', selection('x', 'results-help')) === null);
  assert(getApprovedPageSelection('results', selection('x'.repeat(121), 'results-help')) === null);
  assert(getApprovedPageSelection('checkout', selection('embarque', 'results-help')) === null);
});

await test('glossary explains travel terms deterministically', () => {
  assert(explainFromGlossary('viação')?.explanation.includes('empresa'));
  assert(explainFromGlossary('termo inexistente') === null);
});

await test('server returns an honest 503 when no provider is configured', async () => {
  const request = new Request('http://local/api/accessibility/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contractVersion: CONTRACT_VERSION,
      requestId: 'request-503',
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
    }),
  });
  const response = await handleAccessibilityRequest(request, 'plan', null);
  assert(response.status === 503);
});

console.log(`\n${passed} testes de acessibilidade passaram.`);
