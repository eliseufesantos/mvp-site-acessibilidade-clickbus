// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { RybenaReceipt } from '../adapters/libras/contracts';
import { getDefaultPreferences } from '../core/preferences';
import type { JourneyStep } from '../../../types';

// O painel dentro do plugin carregaria o CDN real da Rybená.
vi.mock('../adapters/libras/selection', () => {
  const accepted = async (): Promise<RybenaReceipt> => ({ status: 'accepted', state: 'ready', message: '' });
  // Referência ESTÁVEL: o painel lê o snapshot com `useSyncExternalStore`, que
  // trata um objeto novo a cada leitura como mudança de estado e renderiza sem
  // parar. O adaptador real devolve sempre o mesmo `this.snapshot`.
  const snapshot = { state: 'ready', mode: 'libras', message: '', attribution: '', attributionUrl: '', simulated: false } as const;
  return {
    librasAdapter: {
      getSnapshot: () => snapshot,
      subscribe: () => () => undefined,
      initialize: accepted, setMode: accepted, open: accepted, close: accepted, translate: accepted,
      pause: accepted, resume: accepted, stop: accepted, setSpeed: accepted,
    },
  };
});

const { AccessibilityPlugin } = await import('../../../components/accessibility/AccessibilityPlugin');

/*
 * O jsdom não tem `matchMedia`, `visualViewport` nem rolagem real. Os três são
 * justamente o que decide o comportamento do painel no celular — e o que já
 * quebrou nesta base, no Safari do iOS. Aqui cada um é um dublê que o teste
 * controla.
 */
const setViewport = (mobile: boolean) => {
  vi.stubGlobal('matchMedia', vi.fn((media: string) => ({
    matches: mobile, media, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  })));
};

class FakeVisualViewport extends EventTarget {
  height = 850;
  offsetTop = 0;
  width = 402;
  /** O teclado virtual encolhe a viewport VISUAL, e às vezes a desloca. */
  openKeyboard(height: number, offsetTop = 0) {
    this.height = height;
    this.offsetTop = offsetTop;
    this.dispatchEvent(new Event('resize'));
  }
}

const props = () => ({
  canUndo: false,
  getPreferences: () => getDefaultPreferences(),
  getStateRevision: () => 0,
  onApplyPreferences: vi.fn(() => true),
  onResetPreferences: vi.fn(() => true),
  onUndoPreferences: vi.fn(() => true),
  page: 'search' as JourneyStep,
  pageEpoch: 1,
  preferences: getDefaultPreferences(),
  stateRevision: 0,
  storageAvailable: true,
});

const openTrigger = () => screen.getByRole('button', { name: /^abrir acessibilidade/i });

let scrollTo: ReturnType<typeof vi.fn>;

beforeEach(() => {
  scrollTo = vi.fn();
  vi.stubGlobal('scrollTo', scrollTo);
  document.body.removeAttribute('style');
  document.documentElement.removeAttribute('style');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('acionador', () => {
  test('vai para o encaixe do header quando ele existe', () => {
    setViewport(false);
    const slot = document.createElement('div');
    slot.id = 'accessibility-trigger-slot';
    document.body.append(slot);
    render(<AccessibilityPlugin {...props()} />);
    expect(slot.contains(openTrigger())).toBe(true);
  });

  test('sem o encaixe, continua na tela: o controle nunca pode sumir', () => {
    setViewport(false);
    render(<AccessibilityPlugin {...props()} />);
    expect(openTrigger()).toBeInTheDocument();
  });

  test('abre e fecha o painel, e `aria-expanded` acompanha', async () => {
    setViewport(false);
    const user = userEvent.setup({ delay: null });
    render(<AccessibilityPlugin {...props()} />);
    expect(openTrigger()).toHaveAttribute('aria-expanded', 'false');
    await user.click(openTrigger());
    const fechar = screen.getByRole('button', { name: /^fechar acessibilidade/i });
    expect(fechar).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Painel de acessibilidade' })).toBeInTheDocument();
    await user.click(fechar);
    expect(screen.queryByRole('region', { name: 'Painel de acessibilidade' })).toBeNull();
  });
});

describe('foco', () => {
  test('ao abrir, o foco vai para a entrada do painel', async () => {
    setViewport(false);
    render(<AccessibilityPlugin {...props()} />);
    await userEvent.setup({ delay: null }).click(openTrigger());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Assistente' })).toHaveFocus());
  });

  test('Esc fecha e devolve o foco ao acionador', async () => {
    setViewport(false);
    const user = userEvent.setup({ delay: null });
    render(<AccessibilityPlugin {...props()} />);
    await user.click(openTrigger());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Assistente' })).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: 'Painel de acessibilidade' })).toBeNull();
    await waitFor(() => expect(openTrigger()).toHaveFocus());
  });

  test('no celular o painel é um diálogo modal', async () => {
    setViewport(true);
    render(<AccessibilityPlugin {...props()} />);
    await userEvent.setup({ delay: null }).click(openTrigger());
    expect(screen.getByRole('dialog', { name: 'Painel de acessibilidade' })).toHaveAttribute('aria-modal', 'true');
  });
});

describe('trava de rolagem da página', () => {
  const setScrollY = (value: number) => Object.defineProperty(window, 'scrollY', { value, configurable: true });

  test('no celular, tira o body do fluxo e compensa a rolagem atual', async () => {
    // `overflow: hidden` sozinho não segura a rolagem no Safari do iOS: a
    // página corria atrás do painel assim que o teclado subia.
    setViewport(true);
    setScrollY(420);
    render(<AccessibilityPlugin {...props()} />);
    await userEvent.setup({ delay: null }).click(openTrigger());
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-420px');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.width).toBe('100%');
  });

  test('ao fechar, devolve o body e a rolagem ao ponto em que estavam', async () => {
    setViewport(true);
    setScrollY(420);
    const user = userEvent.setup({ delay: null });
    render(<AccessibilityPlugin {...props()} />);
    await user.click(openTrigger());
    await user.click(screen.getByRole('button', { name: /^fechar acessibilidade/i }));
    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.body.style.overflow).toBe('');
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 420 }));
  });

  test('a devolução da rolagem é instantânea, sem a animação suave da raiz', async () => {
    // `html` tem `scroll-behavior: smooth`. Respeitá-lo animaria a página do
    // topo até a posição salva, à vista de quem fechou o painel.
    setViewport(true);
    setScrollY(420);
    let noMomento = '';
    scrollTo.mockImplementation(() => { noMomento = document.documentElement.style.scrollBehavior; });
    const user = userEvent.setup({ delay: null });
    render(<AccessibilityPlugin {...props()} />);
    await user.click(openTrigger());
    await user.click(screen.getByRole('button', { name: /^fechar acessibilidade/i }));
    expect(noMomento).toBe('auto');
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'instant' }));
    expect(document.documentElement.style.scrollBehavior).toBe('');
  });

  test('no desktop a página não é travada: o painel fica ao lado dela', async () => {
    setViewport(false);
    render(<AccessibilityPlugin {...props()} />);
    await userEvent.setup({ delay: null }).click(openTrigger());
    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('');
  });
});

describe('teclado virtual', () => {
  test('no celular, a folha acompanha a viewport visual', async () => {
    setViewport(true);
    const viewport = new FakeVisualViewport();
    vi.stubGlobal('visualViewport', viewport);
    render(<AccessibilityPlugin {...props()} />);
    await userEvent.setup({ delay: null }).click(openTrigger());
    const raiz = document.documentElement.style;
    expect(raiz.getPropertyValue('--a11y-viewport-height')).toBe('850px');
    viewport.openKeyboard(520, 34);
    expect(raiz.getPropertyValue('--a11y-viewport-height')).toBe('520px');
    expect(raiz.getPropertyValue('--a11y-viewport-offset')).toBe('34px');
  });

  test('ao fechar, as medidas saem da raiz', async () => {
    setViewport(true);
    vi.stubGlobal('visualViewport', new FakeVisualViewport());
    const user = userEvent.setup({ delay: null });
    render(<AccessibilityPlugin {...props()} />);
    await user.click(openTrigger());
    await user.click(screen.getByRole('button', { name: /^fechar acessibilidade/i }));
    expect(document.documentElement.style.getPropertyValue('--a11y-viewport-height')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--a11y-viewport-offset')).toBe('');
  });

  test('no desktop a viewport visual não é acompanhada', async () => {
    setViewport(false);
    vi.stubGlobal('visualViewport', new FakeVisualViewport());
    render(<AccessibilityPlugin {...props()} />);
    await userEvent.setup({ delay: null }).click(openTrigger());
    expect(document.documentElement.style.getPropertyValue('--a11y-viewport-height')).toBe('');
  });
});

