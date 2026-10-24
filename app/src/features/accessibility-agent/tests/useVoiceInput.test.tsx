// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useVoiceInput } from '../ui/useVoiceInput';
import { MAX_LISTENING_MS } from '../core/voiceSession';

/**
 * Reconhecedor de voz controlado pelo teste.
 *
 * O real encerra a sessão sozinho, emite erro sem avisar e, com o microfone
 * bloqueado, às vezes nem chega a emitir `onend`. Aqui cada evento só acontece
 * quando o teste manda — é o que permite reproduzir as corridas que já
 * quebraram o ditado nesta base.
 */
class FakeRecognition {
  static instances: FakeRecognition[] = [];

  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  running = false;
  starts = 0;
  stops = 0;
  aborts = 0;

  constructor() {
    FakeRecognition.instances.push(this);
  }

  start() {
    // O navegador recusa `start()` numa sessão que já está rodando.
    if (this.running) throw new Error('InvalidStateError');
    this.running = true;
    this.starts += 1;
  }

  stop() {
    this.stops += 1;
  }

  abort() {
    this.aborts += 1;
    this.running = false;
  }

  /** Resultados desta sessão. Numa sessão nova, `results` recomeça do zero. */
  say(...parts: string[]) {
    this.onresult?.({ resultIndex: 0, results: parts.map((transcript) => ({ isFinal: true, 0: { transcript } })) });
  }

  fail(error: string) {
    this.onerror?.({ error });
  }

  end() {
    this.running = false;
    this.onend?.();
  }
}

const latest = () => FakeRecognition.instances[FakeRecognition.instances.length - 1];
const running = () => FakeRecognition.instances.filter((instance) => instance.running).length;

beforeEach(() => {
  FakeRecognition.instances = [];
  vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('sessão de ditado', () => {
  test('sem reconhecedor no navegador, o ditado se declara indisponível', () => {
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    const { result } = renderHook(() => useVoiceInput());
    expect(result.current.supported).toBe(false);
  });

  test('começa em português, contínua e com resultados parciais', () => {
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    expect(result.current.active).toBe(true);
    expect(latest()).toMatchObject({ lang: 'pt-BR', continuous: true, interimResults: true, running: true });
  });

  test('o silêncio do navegador não encerra o ditado: a sessão religa', () => {
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    const recognition = latest();
    act(() => recognition.end());
    expect(recognition.starts).toBe(2);
    expect(result.current.active).toBe(true);
  });

  test('o que já foi dito sobrevive ao religamento', () => {
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    const recognition = latest();
    act(() => recognition.say('quero aumentar'));
    act(() => recognition.end());
    // A sessão religada recomeça `results` do zero.
    act(() => recognition.say('o texto'));
    expect(result.current.transcript).toBe('quero aumentar o texto');
  });

  test('silêncio e queda de rede não viram mensagem de erro', () => {
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    act(() => latest().fail('no-speech'));
    act(() => latest().end());
    expect(result.current.error).toBe('');
    expect(result.current.active).toBe(true);
  });
});

describe('encerramento', () => {
  test('microfone bloqueado encerra a escuta mesmo sem `onend`', () => {
    // Com a permissão negada a sessão nunca começa e o `onend` pode não vir.
    // A interface ficava presa anunciando "Ouvindo" ao lado do erro.
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    act(() => latest().fail('not-allowed'));
    expect(result.current.active).toBe(false);
    expect(result.current.error).toMatch(/microfone está bloqueado/);
  });

  test('um erro fatal não vira laço de religamento', () => {
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    const recognition = latest();
    act(() => recognition.fail('audio-capture'));
    act(() => recognition.end());
    expect(recognition.starts).toBe(1);
  });

  test('parar libera a interface na hora, sem esperar `onend`', () => {
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(result.current.active).toBe(false);
    expect(latest().stops).toBe(1);
  });

  test('parar e reiniciar antes do `onend` antigo deixa um reconhecedor só', () => {
    // O `onend` atrasado da sessão parada via `listeningRef` já rearmado pela
    // nova e religava o reconhecedor velho por cima do novo.
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    const antigo = latest();
    act(() => antigo.say('primeiro'));
    act(() => result.current.stop());
    act(() => result.current.start());
    const novo = latest();
    act(() => novo.say('segundo'));
    act(() => antigo.end());
    expect(antigo.starts).toBe(1);
    expect(running()).toBe(1);
    expect(result.current.transcript).toBe('primeiro segundo');
  });

  test('o teto de escuta encerra o ditado e explica por quê', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    const recognition = latest();
    vi.setSystemTime(MAX_LISTENING_MS);
    act(() => recognition.end());
    expect(recognition.starts).toBe(1);
    expect(result.current.active).toBe(false);
    expect(result.current.error).toMatch(/dois minutos/);
  });

  test('descartar a transcrição a limpa por completo', () => {
    const { result } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    act(() => latest().say('texto velho'));
    act(() => result.current.reset());
    expect(result.current.transcript).toBe('');
  });

  test('desmontar o componente aborta a sessão em curso', () => {
    const { result, unmount } = renderHook(() => useVoiceInput());
    act(() => result.current.start());
    const recognition = latest();
    unmount();
    expect(recognition.aborts).toBe(1);
  });
});
