// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  AccessibilityServiceError,
  requestExplanation,
  requestPlan,
  requestSimplification,
  type AccessibilityServiceKind,
} from '../core/plannerClient';
import { CONTRACT_VERSION } from '../core/contracts';
import { jsonResponse, plannerRequestBody, plannerResponseBody } from './fixtures';

/*
 * O cliente decide que tipo de falha a pessoa está vendo — e a interface age
 * sobre essa decisão: `busy`, `rate_limited` e `unavailable` acendem o atalho
 * para os recursos; o resto não. Classificar errado some com o atalho no dia
 * em que ele é necessário, ou o mostra quando o problema é outro.
 */

const stubFetch = (implementation: (input: string, init: RequestInit) => Promise<Response>) => {
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const failureOf = async (operation: Promise<unknown>) => {
  try {
    await operation;
  } catch (error) {
    return error;
  }
  throw new Error('esperava uma falha, e a operação concluiu');
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('classificação das respostas de erro', () => {
  test.each<[string, number, Record<string, unknown> | null, AccessibilityServiceKind]>([
    ['cota do provedor esgotada', 502, { code: 'provider_http_429' }, 'busy'],
    ['provedor sobrecarregado', 502, { code: 'provider_http_503' }, 'busy'],
    ['provedor estourou o tempo', 502, { code: 'provider_timeout' }, 'busy'],
    ['quota do próprio site', 429, { error: 'limite' }, 'rate_limited'],
    ['provedor não configurado', 503, { code: 'provider_unconfigured' }, 'unavailable'],
    ['falha genérica do provedor', 502, { code: 'provider_failed', error: 'O provedor falhou.' }, 'failed'],
    ['erro sem corpo legível', 500, null, 'failed'],
  ])('%s → %s', async (_caso, status, body, kind) => {
    stubFetch(async () => (body === null ? new Response('não é json', { status }) : jsonResponse(body, status)));
    const error = await failureOf(requestPlan(plannerRequestBody()));
    expect(error).toBeInstanceOf(AccessibilityServiceError);
    expect((error as AccessibilityServiceError).kind).toBe(kind);
    expect((error as AccessibilityServiceError).status).toBe(status);
  });

  test('o código do provedor vence o status HTTP', async () => {
    // Um 429 que o servidor rotulou como cota do PROVEDOR é sobrecarga
    // passageira, não o limite por IP do próprio site.
    stubFetch(async () => jsonResponse({ code: 'provider_http_429' }, 429));
    const error = await failureOf(requestPlan(plannerRequestBody())) as AccessibilityServiceError;
    expect(error.kind).toBe('busy');
  });

  test('toda mensagem de falha lembra que os ajustes manuais seguem disponíveis', async () => {
    for (const [status, body] of [[502, { code: 'provider_http_429' }], [429, {}], [503, {}], [502, { error: 'X.' }]] as const) {
      stubFetch(async () => jsonResponse(body, status));
      const error = await failureOf(requestPlan(plannerRequestBody())) as AccessibilityServiceError;
      expect(error.message).toMatch(/ajustes manuais continuam disponíveis/);
    }
  });

  test('a mensagem do servidor é preservada numa falha genérica', async () => {
    stubFetch(async () => jsonResponse({ error: 'O provedor de IA não conseguiu responder.' }, 502));
    const error = await failureOf(requestPlan(plannerRequestBody())) as AccessibilityServiceError;
    expect(error.message).toBe('O provedor de IA não conseguiu responder. Os ajustes manuais continuam disponíveis.');
  });
});

describe('falhas de transporte', () => {
  test('rede indisponível vira `network`', async () => {
    stubFetch(async () => { throw new TypeError('Failed to fetch'); });
    const error = await failureOf(requestPlan(plannerRequestBody())) as AccessibilityServiceError;
    expect(error.kind).toBe('network');
  });

  test('cancelamento externo vira `cancelled`, sem esperar a rede', async () => {
    stubFetch((_, init) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    const controller = new AbortController();
    const pending = failureOf(requestPlan(plannerRequestBody(), controller.signal));
    controller.abort();
    const error = await pending as AccessibilityServiceError;
    expect(error.kind).toBe('cancelled');
  });

  test('o teto de 12 segundos aborta o pedido', async () => {
    vi.useFakeTimers();
    stubFetch((_, init) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    const pending = failureOf(requestPlan(plannerRequestBody()));
    await vi.advanceTimersByTimeAsync(11_999);
    let settled = false;
    void pending.then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const error = await pending as AccessibilityServiceError;
    expect(error.kind).toBe('cancelled');
    expect(error.message).toMatch(/12 segundos/);
  });
});

describe('contrato de ida e de volta', () => {
  test('um pedido fora do contrato é recusado sem chegar à rede', async () => {
    const fetchMock = stubFetch(async () => jsonResponse(plannerResponseBody()));
    const invalido = { ...plannerRequestBody(), message: '' };
    await failureOf(requestPlan(invalido));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('uma resposta fora do contrato vira `contract`', async () => {
    stubFetch(async () => jsonResponse({ ...plannerResponseBody(), mode: 'improvise' }));
    const error = await failureOf(requestPlan(plannerRequestBody())) as AccessibilityServiceError;
    expect(error.kind).toBe('contract');
  });

  test('uma resposta de outro pedido é descartada', async () => {
    stubFetch(async () => jsonResponse(plannerResponseBody('outro-pedido')));
    const error = await failureOf(requestPlan(plannerRequestBody('meu-pedido'))) as Error;
    expect(error.message).toBe('A resposta não pertence a esta solicitação.');
  });

  test('o plano válido é enviado por POST em JSON e devolvido já validado', async () => {
    const fetchMock = stubFetch(async () => jsonResponse(plannerResponseBody()));
    const plano = await requestPlan(plannerRequestBody());
    expect(plano).toEqual(plannerResponseBody());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/accessibility/plan');
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('content-type')).toBe('application/json');
    expect(JSON.parse(String(init.body))).toEqual(plannerRequestBody());
  });

  test('explicação e simplificação usam os próprios endpoints e o contrato de texto', async () => {
    const fetchMock = stubFetch(async (_, init) => {
      const { requestId } = JSON.parse(String(init.body)) as { requestId: string };
      return jsonResponse({ contractVersion: CONTRACT_VERSION, requestId, text: 'Explicado.' });
    });
    const explicacao = await requestExplanation({
      contractVersion: CONTRACT_VERSION, requestId: 'e-1', term: 'viação', context: 'ônibus', contentRef: 'search-help',
    });
    const simplificacao = await requestSimplification({
      contractVersion: CONTRACT_VERSION, requestId: 's-1', text: 'Texto longo.', contentRef: 'search-help',
    });
    expect(explicacao.text).toBe('Explicado.');
    expect(simplificacao.text).toBe('Explicado.');
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/accessibility/explain', '/api/accessibility/simplify']);
  });
});
