import type { AccessibilityPreferences } from '../../../types';
import {
  buildRybenaScriptUrl,
  handleRybenaRequest,
  RYBENA_AUTHORIZED_HOST,
} from '../../../../server/accessibility/rybena';
import { RYBENA_SIMULATION_NOTICE } from '../adapters/libras/contracts';
import type { RybenaAdapter } from '../adapters/libras/contracts';
import {
  parseRybenaScriptUrl,
  RybenaBrowserAdapter,
  type RybenaRuntime,
} from '../adapters/libras/rybenaBrowser';
import { RybenaUnavailableAdapter, RYBENA_UNAVAILABLE_MESSAGE } from '../adapters/libras/rybenaUnavailable';
import { RybenaDevelopmentAdapter } from '../adapters/libras/rybenaDevelopment';
import {
  LIBRAS_SIMULATION_ENABLED_VALUE,
  LIBRAS_SIMULATION_ENV_VAR,
  shouldSimulateLibras,
} from '../adapters/libras/selection';
import {
  clearRememberedApprovedPageSelection,
  getApprovedPageSelection,
  getPublicContentTargets,
  rememberApprovedPageSelection,
  resolvePublicContent,
  simplifyPublicContent,
} from '../adapters/clickbus/content';
import {
  ALL_ACTION_TYPES,
  CONTRACT_VERSION,
  PLANNER_RESPONSE_JSON_SCHEMA,
  TEXT_RESPONSE_JSON_SCHEMA,
  parsePlanAction,
  plannerResponseSchema,
  type PlannerResponse,
} from '../core/contracts';
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
    // O teto precisa acomodar os tokens de raciocínio, não só a saída útil.
    assert(payload.generationConfig.maxOutputTokens === 4096);
    // O esquema real precisa chegar ao provedor. Um `{ type: 'object' }` aqui
    // não restringe nada e devolve a estrutura à adivinhação do modelo.
    equal(payload.generationConfig.responseJsonSchema, TEXT_RESPONSE_JSON_SCHEMA);
    assert(payload.generationConfig.candidateCount === undefined);
    assert(payload.generationConfig.temperature === undefined);
    assert(payload.generationConfig.thinkingConfig === undefined);
    assert(payload.store === false);
    assert(init?.signal === controller.signal);
    return new Response(JSON.stringify({
      candidates: [{
        finishReason: 'STOP',
        content: { parts: [{ text: 'internal', thought: true }, { text: '{"ok":' }, { text: 'true}' }] },
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  });

  equal(await provider.complete('system', 'user', controller.signal, TEXT_RESPONSE_JSON_SCHEMA), { ok: true });
  assert(calls === 1);
});

await test('Gemini thinkingLevel uses the documented enum and only for the Gemini 3 family', async () => {
  const signal = new AbortController().signal;
  const thinkingConfigFor = async (model: string) => {
    let captured: Record<string, any> | undefined;
    const provider = new GeminiProvider({
      endpoint: 'https://generativelanguage.googleapis.com/v1beta',
      model,
      apiKey: 'test-only-key',
    }, async (_input, init) => {
      captured = JSON.parse(String(init?.body)) as Record<string, any>;
      return new Response(JSON.stringify({
        candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"ok":true}' }] } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    await provider.complete('system', 'user', signal, TEXT_RESPONSE_JSON_SCHEMA);
    return captured?.generationConfig?.thinkingConfig;
  };

  // O discovery document de v1beta declara o enum em maiúsculas:
  // THINKING_LEVEL_UNSPECIFIED | MINIMAL | LOW | MEDIUM | HIGH.
  for (const model of ['gemini-3', 'gemini-3-pro', 'gemini-3.5-flash']) {
    const thinkingConfig = await thinkingConfigFor(model);
    assert(thinkingConfig?.thinkingLevel === 'LOW');
  }

  // A spec avisa que o campo com modelos anteriores ao Gemini 3 resulta em erro.
  // `gemini-flash-latest` é alias mutável e por isso fica de fora.
  for (const model of ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-30-legacy']) {
    assert(await thinkingConfigFor(model) === undefined);
  }
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
    responseFor({ promptFeedback: { blockReason: 'SAFETY' } }).complete('system', 'user', signal, TEXT_RESPONSE_JSON_SCHEMA),
    'provider_blocked_response',
  );
  await expectError(
    responseFor({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{}' }] } }] }).complete('system', 'user', signal, TEXT_RESPONSE_JSON_SCHEMA),
    'provider_incomplete_response',
  );
  await expectError(
    responseFor({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'not-json' }] } }] }).complete('system', 'user', signal, TEXT_RESPONSE_JSON_SCHEMA),
    'provider_invalid_json',
  );
  // 400 é determinístico: repetir só reproduziria a mesma recusa.
  let httpCalls = 0;
  const httpFailure = new GeminiProvider(configuration, async () => {
    httpCalls += 1;
    return new Response('{"error":{"message":"upstream detail must stay private"}}', { status: 400 });
  });
  await expectError(httpFailure.complete('system', 'user', signal, TEXT_RESPONSE_JSON_SCHEMA), 'provider_http_400');
  assert(httpCalls === 1);
});

await test('Gemini provider retries once on 429 and 503 and never on deterministic failures', async () => {
  const configuration = {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash',
    apiKey: 'test-only-key',
  };
  const signal = new AbortController().signal;
  const okBody = () => new Response(JSON.stringify({
    candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"ok":true}' }] } }],
  }), { status: 200, headers: { 'content-type': 'application/json' } });

  // Recusa transitória seguida de sucesso: a segunda tentativa entrega.
  for (const status of [429, 503]) {
    let calls = 0;
    const provider = new GeminiProvider(configuration, async () => {
      calls += 1;
      return calls === 1 ? new Response('{}', { status }) : okBody();
    });
    equal(await provider.complete('system', 'user', signal, TEXT_RESPONSE_JSON_SCHEMA), { ok: true });
    assert(calls === 2, `esperava uma repeticao para ${status}, houve ${calls} chamada(s)`);
  }

  // Recusa persistente: exatamente duas chamadas, nunca um laço.
  for (const status of [429, 503]) {
    let calls = 0;
    const provider = new GeminiProvider(configuration, async () => {
      calls += 1;
      return new Response('{}', { status });
    });
    await expectError(provider.complete('system', 'user', signal, TEXT_RESPONSE_JSON_SCHEMA), `provider_http_${status}`);
    assert(calls === 2, `esperava no maximo uma repeticao para ${status}, houve ${calls}`);
  }

  // Falhas determinísticas não repetem.
  for (const status of [400, 403, 404, 500]) {
    let calls = 0;
    const provider = new GeminiProvider(configuration, async () => {
      calls += 1;
      return new Response('{}', { status });
    });
    await expectError(provider.complete('system', 'user', signal, TEXT_RESPONSE_JSON_SCHEMA), `provider_http_${status}`);
    assert(calls === 1, `${status} nao pode repetir, houve ${calls} chamada(s)`);
  }

  // `retry-after` longo é limitado para caber no timeout de 10 s do handler.
  let cappedCalls = 0;
  const capped = new GeminiProvider(configuration, async () => {
    cappedCalls += 1;
    return cappedCalls === 1
      ? new Response('{}', { status: 503, headers: { 'retry-after': '600' } })
      : okBody();
  });
  const startedAt = Date.now();
  equal(await capped.complete('system', 'user', signal, TEXT_RESPONSE_JSON_SCHEMA), { ok: true });
  assert(Date.now() - startedAt < 4_000, 'a espera do retry-after precisa respeitar o teto');

  // Cancelar durante a espera interrompe em vez de seguir para a segunda tentativa.
  const aborting = new AbortController();
  let abortedCalls = 0;
  const abortable = new GeminiProvider(configuration, async () => {
    abortedCalls += 1;
    setTimeout(() => aborting.abort(), 10);
    return new Response('{}', { status: 503 });
  });
  await expectError(abortable.complete('system', 'user', aborting.signal, TEXT_RESPONSE_JSON_SCHEMA), 'provider_aborted');
  assert(abortedCalls === 1);
});

await test('server sends the matching output schema and surfaces a stable failure code', async () => {
  const schemaFor = async (endpoint: 'plan' | 'explain' | 'simplify', body: unknown) => {
    let received: unknown;
    const provider: LlmProvider = {
      complete: async (_system, _user, _signal, responseSchema) => {
        received = responseSchema;
        throw new Error('provider_incomplete_response');
      },
    };
    const response = await handleAccessibilityRequest(
      new Request(`http://local/api/accessibility/${endpoint}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://local' },
        body: JSON.stringify(body),
      }),
      endpoint,
      provider,
      unlimitedQuota,
    );
    return { received, payload: await response.json() as Record<string, unknown>, status: response.status };
  };

  const planned = await schemaFor('plan', plannerRequestBody());
  equal(planned.received, PLANNER_RESPONSE_JSON_SCHEMA);
  const explained = await schemaFor('explain', {
    contractVersion: CONTRACT_VERSION, requestId: 'r', term: 'embarque', context: 'x', contentRef: 'results-help',
  });
  equal(explained.received, TEXT_RESPONSE_JSON_SCHEMA);

  // Seis falhas distintas do adaptador não podem virar a mesma mensagem opaca.
  assert(planned.status === 502 && planned.payload.code === 'provider_incomplete_response');
  assert(typeof planned.payload.error === 'string');

  // Uma exceção inesperada não pode vazar texto interno como código.
  const opaque: LlmProvider = {
    complete: async () => { throw new Error('ReferenceError: detalhe interno do runtime'); },
  };
  const unexpected = await handleAccessibilityRequest(jsonRequest(plannerRequestBody()), 'plan', opaque, unlimitedQuota);
  assert((await unexpected.json() as Record<string, unknown>).code === 'provider_failed');

  // Resposta completa porém fora do contrato recebe código próprio.
  const offContract: LlmProvider = { complete: async () => ({ contractVersion: CONTRACT_VERSION, requestId: 'r', extra: true }) };
  const mismatch = await handleAccessibilityRequest(jsonRequest(plannerRequestBody()), 'plan', offContract, unlimitedQuota);
  const mismatchBody = await mismatch.json() as Record<string, unknown>;
  assert(mismatch.status === 502 && mismatchBody.code === 'contract_mismatch');
  assert(typeof mismatchBody.detail === 'string');
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
    rybena: libras as RybenaAdapter,
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
  const adapter: RybenaAdapter = new RybenaUnavailableAdapter();
  const receipt = await adapter.translate({ id: 'search-help', text: 'Ajuda' });
  assert(receipt.status === 'unavailable' && receipt.message === RYBENA_UNAVAILABLE_MESSAGE);
});

await test('Rybená accepts only the expected tokenized API script URL', () => {
  const testToken = 'a'.repeat(64);
  const expected = `https://cdn.rybena.com.br/dom/master/latest/rybena.js?token=${testToken}&mode=api&doNotTrack=true`;
  assert(parseRybenaScriptUrl(expected) === expected);

  for (const invalid of [
    `https://attacker.example/dom/master/latest/rybena.js?token=${testToken}&mode=api&doNotTrack=true`,
    'https://cdn.rybena.com.br/dom/master/latest/rybena.js?token=short&mode=api&doNotTrack=true',
    `https://cdn.rybena.com.br/dom/master/latest/rybena.js?token=${testToken}&mode=full&doNotTrack=true`,
    `https://cdn.rybena.com.br/dom/master/latest/rybena.js?token=${testToken}&mode=api&doNotTrack=false`,
    `https://cdn.rybena.com.br/dom/master/latest/rybena.js?token=${testToken}&mode=api&doNotTrack=true&extra=value`,
    `https://cdn.rybena.com.br/dom/master/latest/rybena.js?token=${testToken}&token=${testToken}&mode=api&doNotTrack=true`,
    `https://cdn.rybena.com.br/dom/master/latest/rybena.js?token=${testToken}&mode=api&doNotTrack=true#unexpected`,
  ]) {
    let rejected = false;
    try { parseRybenaScriptUrl(invalid); } catch { rejected = true; }
    assert(rejected, 'unexpected Rybená script URL should be rejected');
  }
});

await test('Rybená runtime configuration is server-sourced and fails closed', async () => {
  const testToken = 'b'.repeat(64);
  const scriptUrl = buildRybenaScriptUrl(testToken);
  assert(scriptUrl !== null && parseRybenaScriptUrl(scriptUrl) === scriptUrl);
  assert(buildRybenaScriptUrl('invalid') === null);

  const missing = handleRybenaRequest(new Request('http://local/api/accessibility/rybena'), {});
  assert(missing.status === 503 && missing.headers.get('cache-control') === 'no-store');
  assert(!(await missing.text()).includes(testToken));

  const wrongMethod = handleRybenaRequest(new Request('http://local/api/accessibility/rybena', {
    method: 'POST',
  }), { RYBENA_ACCESS_TOKEN: testToken });
  assert(wrongMethod.status === 405 && wrongMethod.headers.get('allow') === 'GET');

  const wrongHost = handleRybenaRequest(
    new Request('https://preview.example/api/accessibility/rybena'),
    { RYBENA_ACCESS_TOKEN: testToken },
  );
  assert(wrongHost.status === 403);
  const insecureOrigin = handleRybenaRequest(
    new Request(`http://${RYBENA_AUTHORIZED_HOST}/api/accessibility/rybena`),
    { RYBENA_ACCESS_TOKEN: testToken },
  );
  assert(insecureOrigin.status === 403);

  const configured = handleRybenaRequest(
    new Request(`https://${RYBENA_AUTHORIZED_HOST}/api/accessibility/rybena`),
    { RYBENA_ACCESS_TOKEN: testToken },
  );
  assert(configured.status === 200);
  assert(configured.headers.get('cache-control') === 'no-store');
  assert(configured.headers.get('cross-origin-resource-policy') === 'same-origin');
  assert(configured.headers.get('x-content-type-options') === 'nosniff');
  const payload = await configured.json() as { scriptUrl?: unknown };
  assert(parseRybenaScriptUrl(payload.scriptUrl) === scriptUrl);
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
    switchToVoz: () => calls.push('voz'),
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
  // `libras` logo apos `speed:1` e a sincronizacao do modo declarado na carga:
  // o player nasce no modo que o snapshot anuncia, nunca num modo implicito.
  equal(calls, [
    'speed:1', 'libras', 'speed:0.75', 'open', 'libras', 'speed:0.75', 'translate:Ajuda da busca',
    'pause', 'play', 'stop', 'close',
  ]);
});

await test('development Libras adapter walks the real state machine without network', async () => {
  let pendingTranslation: (() => void) | null = null;
  const adapter = new RybenaDevelopmentAdapter({
    delay: async () => undefined,
    schedule: (callback) => {
      pendingTranslation = callback;
      return () => { pendingTranslation = null; };
    },
  });

  const initial = adapter.getSnapshot();
  assert(initial.state === 'idle' && initial.simulated === true, 'simulação deve se declarar simulação');
  assert(initial.message.includes(RYBENA_SIMULATION_NOTICE), 'a mensagem inicial deve avisar que é simulação');
  assert(!initial.attribution.includes('Tradução em Libras'), 'o double não pode reivindicar tradução real');

  assert((await adapter.initialize()).status === 'accepted');
  assert(adapter.getSnapshot().state === 'ready');

  assert((await adapter.open()).status === 'accepted');
  assert((await adapter.translate({ id: 'search-help', text: 'Ajuda da busca' })).status === 'accepted');
  assert(adapter.getSnapshot().state === 'translating');

  assert((await adapter.pause()).status === 'accepted');
  assert(adapter.getSnapshot().state === 'paused');
  assert(pendingTranslation === null, 'pausar deve cancelar o término agendado');

  assert((await adapter.resume()).status === 'accepted');
  assert(adapter.getSnapshot().state === 'translating');

  assert((await adapter.stop()).status === 'accepted');
  assert(adapter.getSnapshot().state === 'ready');

  assert((await adapter.close()).status === 'accepted');
  assert(adapter.getSnapshot().state === 'ready');

  // O término agendado devolve o player a `ready`, como o handleTranslate real.
  await adapter.translate({ id: 'search-help', text: 'Ajuda da busca' });
  assert(adapter.getSnapshot().state === 'translating');
  (pendingTranslation as unknown as () => void)();
  assert(adapter.getSnapshot().state === 'ready');
});

await test('development Libras adapter is idempotent and rejects impossible transitions', async () => {
  const adapter = new RybenaDevelopmentAdapter({ delay: async () => undefined, schedule: () => () => undefined });

  const first = await adapter.initialize();
  const second = await adapter.initialize();
  assert(first.status === 'accepted' && second.status === 'accepted');
  assert(adapter.getSnapshot().state === 'ready');

  assert((await adapter.open()).status === 'accepted');
  const reopened = await adapter.open();
  assert(reopened.status === 'accepted' && reopened.message.includes('já estava aberto'));

  assert((await adapter.pause()).status === 'failed', 'não há o que pausar sem tradução em curso');
  assert((await adapter.resume()).status === 'failed', 'não há o que retomar sem pausa');
  assert((await adapter.translate({ id: 'search-help', text: '   ' })).status === 'failed');

  const closed = await adapter.close();
  const closedAgain = await adapter.close();
  assert(closed.status === 'accepted' && closedAgain.status === 'accepted');

  const speed = await adapter.setSpeed(0.75);
  const sameSpeed = await adapter.setSpeed(0.75);
  assert(speed.status === 'accepted' && sameSpeed.message.includes('já estava'));
});

await test('the simulated Libras adapter is unreachable outside development', () => {
  assert(LIBRAS_SIMULATION_ENV_VAR === 'VITE_A11Y_LIBRAS_SIMULATION');
  assert(LIBRAS_SIMULATION_ENABLED_VALUE === 'on');

  // Produção: nem mesmo com a flag ligada.
  assert(shouldSimulateLibras({ dev: false, simulation: LIBRAS_SIMULATION_ENABLED_VALUE }) === false);
  assert(shouldSimulateLibras({ dev: false, simulation: undefined }) === false);

  // Desenvolvimento: só com a flag exatamente no valor de ativação.
  assert(shouldSimulateLibras({ dev: true, simulation: undefined }) === false);
  assert(shouldSimulateLibras({ dev: true, simulation: '' }) === false);
  assert(shouldSimulateLibras({ dev: true, simulation: 'off' }) === false);
  assert(shouldSimulateLibras({ dev: true, simulation: 'true' }) === false);
  assert(shouldSimulateLibras({ dev: true, simulation: LIBRAS_SIMULATION_ENABLED_VALUE }) === true);
});

await test('only the development adapter declares itself simulated', () => {
  assert(new RybenaDevelopmentAdapter().getSnapshot().simulated === true);
  assert(new RybenaUnavailableAdapter().getSnapshot().simulated === false);
  assert(new RybenaBrowserAdapter(async () => { throw new Error('sem runtime'); }).getSnapshot().simulated === false);
});

await test('contract 2.1 carries the voice actions and rejects the previous version', () => {
  assert(CONTRACT_VERSION === '2.1');
  for (const type of ['open_voice', 'close_voice', 'speak_content', 'pause_voice', 'resume_voice', 'stop_voice']) {
    assert(ALL_ACTION_TYPES.includes(type as never), `${type} deveria estar no contrato`);
  }

  // speak_content aceita contentRef, como translate_content.
  const spoken = parsePlanAction({ type: 'speak_content', contentRef: 'search-help' });
  equal(spoken, { type: 'speak_content', contentRef: 'search-help' });
  assert(parsePlanAction({ type: 'speak_content' }) === null, 'speak_content sem contentRef é inválido');
  assert(parsePlanAction({ type: 'speak_content', contentRef: 'a', extra: 1 }) === null);
  assert(parsePlanAction({ type: 'narrate_everything' }) === null, 'ação inventada é rejeitada');

  // Um plano 2.0 em voo não pode ser aplicado pela metade: é descartado.
  const legacy = { ...plannerResponseBody('request-legacy'), contractVersion: '2.0' };
  assert(plannerResponseSchema.safeParse(legacy).success === false, 'plano 2.0 deve ser rejeitado');
  assert(plannerResponseSchema.safeParse(plannerResponseBody('request-current')).success === true);

  // O esquema enviado ao provedor deriva das mesmas constantes.
  const schemaTypes = PLANNER_RESPONSE_JSON_SCHEMA.properties.actions.items.properties.type.enum;
  equal([...schemaTypes].sort(), [...ALL_ACTION_TYPES].sort());
  equal(PLANNER_RESPONSE_JSON_SCHEMA.properties.contractVersion.enum, ['2.1']);
});

await test('executor routes voice and Libras to the same player in the right mode', async () => {
  const calls: string[] = [];
  const player = new RybenaDevelopmentAdapter({ delay: async () => undefined, schedule: () => () => undefined });
  const traced: RybenaAdapter = {
    ...player,
    setMode: async (mode) => { calls.push(`mode:${mode}`); return player.setMode(mode); },
    open: async () => { calls.push('open'); return player.open(); },
    close: async () => { calls.push('close'); return player.close(); },
    translate: async (content) => { calls.push(`translate:${content.id}`); return player.translate(content); },
    pause: async () => { calls.push('pause'); return player.pause(); },
    resume: async () => { calls.push('resume'); return player.resume(); },
    stop: async () => { calls.push('stop'); return player.stop(); },
  };

  const capabilities = [
    'open_libras', 'translate_content', 'pause_libras', 'stop_libras',
    'open_voice', 'speak_content', 'pause_voice', 'stop_voice', 'close_voice',
  ] as const;

  const dependencies = {
    requestId: 'request-voice',
    getStateRevision: () => 0,
    getPageEpoch: () => 1,
    getPanelSession: () => 1,
    getPreferences: () => getDefaultPreferences(),
    applyPreferences: () => false,
    undoPreferences: () => false,
    resetPreferences: () => false,
    resolveContent: (id: string) => resolvePublicContent('search', id),
    rybena: traced,
    capabilities,
  };

  const plan = (planId: string, actions: unknown[]): unknown => ({
    ...plannerResponseBody('request-voice'), planId, mode: 'apply', actions,
  });

  const executor = new AccessibilityExecutor();

  const spoken = await executor.execute(plan('plan-voz', [{ type: 'speak_content', contentRef: 'search-help' }]), dependencies);
  assert(spoken.status === 'applied');
  assert(traced.getSnapshot().mode === 'voz', 'narrar deve deixar o player em voz');

  // Transporte de Libras enquanto a voz toca: recusa honesta, sem efeito.
  const crossed = await executor.execute(plan('plan-cruzado', [{ type: 'pause_libras' }]), dependencies);
  assert(crossed.status === 'rejected', 'pausar Libras com voz tocando deve falhar');
  assert(crossed.actions[0].message.includes('voz'), crossed.actions[0].message);
  assert(traced.getSnapshot().state === 'translating', 'o estado não pode ter mudado');

  // Transporte do modo certo funciona.
  const paused = await executor.execute(plan('plan-pausa-voz', [{ type: 'pause_voice' }]), dependencies);
  assert(paused.status === 'applied' && traced.getSnapshot().state === 'paused');

  // Trocar para Libras é uma ação de entrada: troca o modo antes de agir.
  const libras = await executor.execute(plan('plan-libras', [{ type: 'translate_content', contentRef: 'search-help' }]), dependencies);
  assert(libras.status === 'applied' && traced.getSnapshot().mode === 'libras');

  assert(calls.includes('mode:voz') && calls.includes('mode:libras'));
  assert(!calls.includes('mode:voz;mode:voz'));
});

await test('executor refuses player actions that are not in the capability list', async () => {
  const player = new RybenaDevelopmentAdapter({ delay: async () => undefined, schedule: () => () => undefined });
  const dependencies = {
    requestId: 'request-cap',
    getStateRevision: () => 0,
    getPageEpoch: () => 1,
    getPanelSession: () => 1,
    getPreferences: () => getDefaultPreferences(),
    applyPreferences: () => false,
    undoPreferences: () => false,
    resetPreferences: () => false,
    resolveContent: (id: string) => resolvePublicContent('search', id),
    rybena: player,
    // Voz ausente de propósito: é o caso de "capacidade indisponível".
    capabilities: ['open_libras'] as const,
  };
  const executor = new AccessibilityExecutor();
  let rejected = false;
  try {
    await executor.execute({
      ...plannerResponseBody('request-cap'), planId: 'plan-sem-voz', mode: 'apply',
      actions: [{ type: 'open_voice' }],
    }, dependencies);
  } catch (error) {
    rejected = error instanceof PlanExecutionError;
  }
  assert(rejected, 'capacidade ausente deve ser recusada antes de qualquer efeito');
  assert(player.getSnapshot().state === 'idle', 'nada pode ter acontecido com o player');
});

await test('the Rybena port never exposes the vendor visual controls to the executor', async () => {
  // Secao 7.4: os ajustes visuais sao do executor local. Se a Rybena tambem
  // aplicar, os efeitos somam e quebram. Este runtime registra qualquer toque.
  const visualTouched: string[] = [];
  const visualMethods = [
    'toggleZoom', 'nextZoom', 'previousZoom', 'toggleDarkContrast', 'toggleLightContrast',
    'toggleInvertedContrast', 'toggleLineHeight', 'toggleLetterSpacing', 'toggleCursorSize',
    'toggleAmplifyCursor', 'toggleLinkHighlight', 'toggleTitleHighlight', 'toggleReadingMask',
    'toggleCursorGuide', 'togglePauseAnimations', 'toggleDictionary',
  ];
  const runtime = {
    closePlayer: () => undefined,
    handleLoaded: (callback: () => void) => callback(),
    handleTranslate: () => undefined,
    isTranslating: () => false,
    openPlayer: () => undefined,
    pause: () => undefined,
    play: () => undefined,
    setSpeed: () => undefined,
    stop: () => undefined,
    switchToLibras: () => undefined,
    switchToVoz: () => undefined,
    translate: () => undefined,
  } as unknown as RybenaRuntime;
  for (const method of visualMethods) {
    Object.assign(runtime, { [method]: () => visualTouched.push(method) });
  }

  const adapter = new RybenaBrowserAdapter(async () => runtime);
  const executor = new AccessibilityExecutor();
  const dependencies = {
    requestId: 'request-visual',
    getStateRevision: () => 0,
    getPageEpoch: () => 1,
    getPanelSession: () => 1,
    getPreferences: () => getDefaultPreferences(),
    applyPreferences: () => true,
    undoPreferences: () => false,
    resetPreferences: () => false,
    resolveContent: (id: string) => resolvePublicContent('search', id),
    rybena: adapter,
    capabilities: [
      'set_preferences', 'apply_comfortable_reading', 'open_libras', 'translate_content',
      'open_voice', 'speak_content', 'set_libras_speed', 'close_voice',
    ] as const,
  };

  const run = (planId: string, actions: unknown[]) => executor.execute({
    ...plannerResponseBody('request-visual'), planId, mode: 'apply', actions,
  }, dependencies);

  await run('plan-v1', [{ type: 'set_preferences', patch: { contrast: 'high', textScale: 1.5 } }]);
  await run('plan-v2', [{ type: 'apply_comfortable_reading' }]);
  await run('plan-v3', [{ type: 'translate_content', contentRef: 'search-help' }]);
  await run('plan-v4', [{ type: 'speak_content', contentRef: 'search-help' }]);
  await run('plan-v5', [{ type: 'set_libras_speed', speed: 1.25 }]);
  await run('plan-v6', [{ type: 'close_voice' }]);

  equal(visualTouched, []);
  // E o port simplesmente nao declara esses metodos.
  for (const method of visualMethods) {
    assert(!(method in (adapter as unknown as Record<string, unknown>)), `${method} não pode existir no adaptador`);
  }
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
