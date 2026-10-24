import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GeminiProvider } from '../../../../server/accessibility/provider';
import { TEXT_RESPONSE_JSON_SCHEMA } from '../core/contracts';

/*
 * O retry do provedor tem números que importam: 600 ms de espera padrão e teto
 * de 2 s mesmo quando o provedor pede mais em `retry-after`. O teto existe para
 * a segunda tentativa caber no limite de 10 s do handler.
 *
 * O teste anterior esperava esses atrasos em relógio real — 4,5 s, quase toda a
 * duração da suíte — e verificava o teto só com "levou menos de 4 s". Medido
 * por mutação: com o teto em 2,4 s ele continuava passando. Com o teto em 3,5 s
 * falhava, mas por acaso — a soma das esperas estourava o limite de 5 s do
 * Vitest, não a asserção do teto.
 *
 * Com relógio falso cada valor é fixado no milissegundo: um instante antes a
 * segunda chamada ainda não aconteceu, no instante exato ela acontece. A
 * contagem de chamadas é conferida ANTES de aguardar a promessa, para que um
 * tempo errado falhe na hora com "esperava 2, veio 1" em vez de travar até o
 * timeout.
 */
const configuration = {
  endpoint: 'https://generativelanguage.googleapis.com/v1beta',
  model: 'gemini-2.5-flash',
  apiKey: 'test-only-key',
};

const ok = () => new Response(JSON.stringify({
  candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"ok":true}' }] } }],
}), { status: 200, headers: { 'content-type': 'application/json' } });

/** Transporte falso que conta as chamadas e responde conforme a ordem delas. */
const transport = (respond: (call: number) => Response) => {
  let calls = 0;
  const fetchImplementation = async () => {
    calls += 1;
    return respond(calls);
  };
  return { fetchImplementation, calls: () => calls };
};

const complete = (fetchImplementation: () => Promise<Response>, signal = new AbortController().signal) =>
  new GeminiProvider(configuration, fetchImplementation).complete('system', 'user', signal, TEXT_RESPONSE_JSON_SCHEMA);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('retry do provedor Gemini', () => {
  test.each([429, 503])('recusa passageira %i é repetida uma vez, após 600 ms', async (status) => {
    const fake = transport((call) => (call === 1 ? new Response('{}', { status }) : ok()));
    const pending = complete(fake.fetchImplementation);
    await vi.advanceTimersByTimeAsync(599);
    expect(fake.calls()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fake.calls()).toBe(2);
    await expect(pending).resolves.toEqual({ ok: true });
  });

  test.each([429, 503])('recusa persistente %i para em duas chamadas, nunca num laço', async (status) => {
    const fake = transport(() => new Response('{}', { status }));
    const pending = complete(fake.fetchImplementation);
    const settled = expect(pending).rejects.toThrow(`provider_http_${status}`);
    await vi.runAllTimersAsync();
    await settled;
    expect(fake.calls()).toBe(2);
  });

  test.each([400, 403, 404, 500])('falha determinística %i não é repetida', async (status) => {
    const fake = transport(() => new Response('{}', { status }));
    await expect(complete(fake.fetchImplementation)).rejects.toThrow(`provider_http_${status}`);
    expect(fake.calls()).toBe(1);
  });

  test('`retry-after` longo é limitado a exatamente 2 s', async () => {
    // O provedor pede 10 minutos; esperar isso estouraria o limite do handler.
    const fake = transport((call) => (call === 1
      ? new Response('{}', { status: 503, headers: { 'retry-after': '600' } })
      : ok()));
    const pending = complete(fake.fetchImplementation);
    await vi.advanceTimersByTimeAsync(1_999);
    expect(fake.calls()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fake.calls()).toBe(2);
    await expect(pending).resolves.toEqual({ ok: true });
  });

  test('`retry-after` curto é respeitado quando cabe no teto', async () => {
    const fake = transport((call) => (call === 1
      ? new Response('{}', { status: 429, headers: { 'retry-after': '1' } })
      : ok()));
    const pending = complete(fake.fetchImplementation);
    await vi.advanceTimersByTimeAsync(999);
    expect(fake.calls()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fake.calls()).toBe(2);
    await expect(pending).resolves.toEqual({ ok: true });
  });

  test('cancelar durante a espera interrompe em vez de seguir para a segunda tentativa', async () => {
    const controller = new AbortController();
    const fake = transport(() => new Response('{}', { status: 503 }));
    const pending = complete(fake.fetchImplementation, controller.signal);
    const settled = expect(pending).rejects.toThrow('provider_aborted');
    await vi.advanceTimersByTimeAsync(100);
    controller.abort();
    await settled;
    expect(fake.calls()).toBe(1);
  });
});
