import type { AccessibilityPreferences } from '../../../types';
import type { LibrasAdapter } from '../adapters/libras/contracts';
import { RybenaBrowserAdapter, type RybenaRuntime } from '../adapters/libras/rybenaBrowser';
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
import {
  createAccessibilityRequestQuota,
  handleAccessibilityRequest,
  MAX_ACCESSIBILITY_REQUEST_BYTES,
  type AccessibilityRequestQuota,
} from '../../../../server/accessibility/handler';
import {
  buildGeminiGenerateContentUrl,
  GeminiProvider,
  getConfiguredProvider,
  type LlmProvider,
} from '../../../../server/accessibility/provider';

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

const unlimitedQuota: AccessibilityRequestQuota = { consume: () => ({ allowed: true }) };

const plannerRequestBody = (requestId = 'request-test') => ({
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

const plannerResponseBody = (requestId = 'request-test'): PlannerResponse => ({
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

const jsonRequest = (body: unknown, origin = 'http://local') => new Request('http://local/api/accessibility/plan', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

const expectError = async (operation: Promise<unknown>, expectedMessage: string) => {
  let received = '';
  try {
    await operation;
  } catch (error) {
    received = error instanceof Error ? error.message : String(error);
  }
  assert(received === expectedMessage, `expected ${expectedMessage}, received ${received || 'no error'}`);
};

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

await test('Gemini endpoint builder accepts only the native Google host and matching model', () => {
  const expected = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
  assert(buildGeminiGenerateContentUrl('https://generativelanguage.googleapis.com/v1beta', 'gemini-flash-latest') === expected);
  assert(buildGeminiGenerateContentUrl(expected, 'models/gemini-flash-latest') === expected);
  let rejected = 0;
  for (const [endpoint, model] of [
    ['https://example.com/v1beta', 'gemini-flash-latest'],
    [expected, 'outro-modelo'],
    ['http://generativelanguage.googleapis.com/v1beta', 'gemini-flash-latest'],
  ]) {
    try { buildGeminiGenerateContentUrl(endpoint, model); } catch { rejected += 1; }
  }
  assert(rejected === 3);
});

await test('Gemini provider sends a native structured request and parses split JSON parts', async () => {
  const sentinelKey = 'test-only-key';
  const controller = new AbortController();
  let calls = 0;
  const provider = new GeminiProvider({
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-flash-latest',
    apiKey: sentinelKey,
  }, async (input, init) => {
    calls += 1;
    const url = String(input);
    const headers = new Headers(init?.headers);
    const payload = JSON.parse(String(init?.body)) as Record<string, any>;
    assert(url === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent');
    assert(headers.get('x-goog-api-key') === sentinelKey);
    assert(!url.includes(sentinelKey) && !String(init?.body).includes(sentinelKey));
    assert(payload.systemInstruction.parts[0].text === 'system');
    assert(payload.contents[0].role === 'user' && payload.contents[0].parts[0].text === 'user');
    assert(payload.generationConfig.responseMimeType === 'application/json');
    assert(payload.generationConfig.maxOutputTokens === 1024);
    assert(payload.generationConfig.candidateCount === undefined);
    assert(payload.generationConfig.temperature === undefined);
    assert(payload.generationConfig.thinkingConfig.thinkingLevel === 'low');
    assert(payload.store === false);
    assert(init?.signal === controller.signal);
    return new Response(JSON.stringify({
      candidates: [{
        finishReason: 'STOP',
        content: { parts: [{ text: 'internal', thought: true }, { text: '{"ok":' }, { text: 'true}' }] },
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  });

  equal(await provider.complete('system', 'user', controller.signal), { ok: true });
  assert(calls === 1);
});

await test('Gemini provider fails closed on blocked, incomplete and malformed responses without retry', async () => {
  const configuration = {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-flash-latest',
    apiKey: 'test-only-key',
  };
  const responseFor = (body: unknown) => new GeminiProvider(configuration, async () =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }));
  const signal = new AbortController().signal;
  await expectError(
    responseFor({ promptFeedback: { blockReason: 'SAFETY' } }).complete('system', 'user', signal),
    'provider_blocked_response',
  );
  await expectError(
    responseFor({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{}' }] } }] }).complete('system', 'user', signal),
    'provider_incomplete_response',
  );
  await expectError(
    responseFor({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'not-json' }] } }] }).complete('system', 'user', signal),
    'provider_invalid_json',
  );
  let httpCalls = 0;
  const httpFailure = new GeminiProvider(configuration, async () => {
    httpCalls += 1;
    return new Response('{"error":{"message":"upstream detail must stay private"}}', { status: 429 });
  });
  await expectError(httpFailure.complete('system', 'user', signal), 'provider_http_429');
  assert(httpCalls === 1);
});

await test('provider factory keeps missing configuration disabled and selects Gemini by host', () => {
  assert(getConfiguredProvider({}) === null);
  assert(getConfiguredProvider({
    ACCESSIBILITY_LLM_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta',
    ACCESSIBILITY_LLM_MODEL: 'gemini-flash-latest',
  }) === null);
  const configured = getConfiguredProvider({
    ACCESSIBILITY_LLM_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta',
    ACCESSIBILITY_LLM_MODEL: 'gemini-flash-latest',
    ACCESSIBILITY_LLM_API_KEY: 'test-only-key',
  });
  assert(configured instanceof GeminiProvider);
  assert(getConfiguredProvider({
    ACCESSIBILITY_LLM_ENDPOINT: 'https://provider.example/v1',
    ACCESSIBILITY_LLM_MODEL: 'compatible-model',
    ACCESSIBILITY_LLM_API_KEY: 'test-only-key',
  }) !== null);
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

await test('Rybená browser adapter maps the documented player controls', async () => {
  const calls: string[] = [];
  let onTranslated: () => void = () => undefined;
  const runtime: RybenaRuntime = {
    closePlayer: () => calls.push('close'),
    handleLoaded: () => undefined,
    handleTranslate: (callback) => { onTranslated = callback; },
    isTranslating: () => false,
    openPlayer: () => calls.push('open'),
    pause: () => calls.push('pause'),
    play: () => calls.push('play'),
    setSpeed: (speed) => calls.push(`speed:${speed}`),
    stop: () => calls.push('stop'),
    switchToLibras: () => calls.push('libras'),
    translate: (text) => calls.push(`translate:${text}`),
  };
  const adapter = new RybenaBrowserAdapter(async () => runtime);

  assert((await adapter.initialize()).status === 'accepted');
  await adapter.setSpeed(0.75);
  await adapter.translate({ id: 'search-help', text: 'Ajuda da busca' });
  assert(adapter.getSnapshot().state === 'translating');
  await adapter.pause();
  assert(adapter.getSnapshot().state === 'paused');
  await adapter.resume();
  onTranslated();
  assert(adapter.getSnapshot().state === 'ready');
  await adapter.stop();
  await adapter.close();
  equal(calls, [
    'speed:1', 'speed:0.75', 'open', 'libras', 'speed:0.75', 'translate:Ajuda da busca',
    'pause', 'play', 'stop', 'close',
  ]);
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

await test('server accepts a valid provider response and rejects output outside the safe contract', async () => {
  const validProvider: LlmProvider = {
    complete: async () => plannerResponseBody('request-200'),
  };
  const valid = await handleAccessibilityRequest(
    jsonRequest(plannerRequestBody('request-200')),
    'plan',
    validProvider,
    unlimitedQuota,
  );
  assert(valid.status === 200);
  equal(await valid.json(), plannerResponseBody('request-200'));

  const invalidProvider: LlmProvider = { complete: async () => ({ optimistic: true }) };
  const invalid = await handleAccessibilityRequest(
    jsonRequest(plannerRequestBody('request-502')),
    'plan',
    invalidProvider,
    unlimitedQuota,
  );
  assert(invalid.status === 502);
});

await test('server keeps explanation and simplification on their text-only contracts', async () => {
  const provider: LlmProvider = {
    complete: async (_system, user) => {
      const request = JSON.parse(user) as { requestId: string };
      return { contractVersion: CONTRACT_VERSION, requestId: request.requestId, text: 'Resposta simples.' };
    },
  };
  const explanation = await handleAccessibilityRequest(jsonRequest({
    contractVersion: CONTRACT_VERSION,
    requestId: 'request-explain',
    term: 'embarque',
    context: 'Horário e local de embarque.',
    contentRef: 'results-help',
  }), 'explain', provider, unlimitedQuota);
  const simplification = await handleAccessibilityRequest(jsonRequest({
    contractVersion: CONTRACT_VERSION,
    requestId: 'request-simplify',
    text: 'Compare os horários e os locais de embarque antes de escolher.',
    contentRef: 'results-help',
  }), 'simplify', provider, unlimitedQuota);
  assert(explanation.status === 200 && simplification.status === 200);
});

await test('server rejects cross-origin, non-JSON and oversized requests before calling the provider', async () => {
  let calls = 0;
  const provider: LlmProvider = {
    complete: async () => {
      calls += 1;
      return plannerResponseBody();
    },
  };
  const forbidden = await handleAccessibilityRequest(
    jsonRequest(plannerRequestBody(), 'https://attacker.example'),
    'plan',
    provider,
    unlimitedQuota,
  );
  assert(forbidden.status === 403);

  const unsupportedMedia = await handleAccessibilityRequest(new Request('http://local/api/accessibility/plan', {
    method: 'POST',
    headers: { origin: 'http://local', 'content-type': 'text/plain' },
    body: JSON.stringify(plannerRequestBody()),
  }), 'plan', provider, unlimitedQuota);
  assert(unsupportedMedia.status === 415);

  const oversized = await handleAccessibilityRequest(
    jsonRequest(`{"value":"${'x'.repeat(MAX_ACCESSIBILITY_REQUEST_BYTES)}"}`),
    'plan',
    provider,
    unlimitedQuota,
  );
  assert(oversized.status === 413 && calls === 0);
});

await test('server rate limit returns 429 without a second paid provider call', async () => {
  let calls = 0;
  const provider: LlmProvider = {
    complete: async (_system, user) => {
      calls += 1;
      const requestId = (JSON.parse(user) as { requestId: string }).requestId;
      return plannerResponseBody(requestId);
    },
  };
  const quota = createAccessibilityRequestQuota({ requestsPerMinute: 1, requestsPerDay: 5, now: () => 1_000 });
  const first = await handleAccessibilityRequest(jsonRequest(plannerRequestBody('request-rate-1')), 'plan', provider, quota);
  const second = await handleAccessibilityRequest(jsonRequest(plannerRequestBody('request-rate-2')), 'plan', provider, quota);
  assert(first.status === 200 && second.status === 429 && second.headers.get('retry-after') === '60');
  assert(calls === 1);
});

await test('server returns an honest 503 when no provider is configured', async () => {
  const response = await handleAccessibilityRequest(jsonRequest(plannerRequestBody('request-503')), 'plan', null, unlimitedQuota);
  assert(response.status === 503);
});

console.log(`\n${passed} testes de acessibilidade passaram.`);
