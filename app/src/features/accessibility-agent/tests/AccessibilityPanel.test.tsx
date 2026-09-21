// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { PlannerRequest, PlannerResponse } from '../core/contracts';
import type { RybenaReceipt, RybenaSnapshot } from '../adapters/libras/contracts';
import { getDefaultPreferences } from '../core/preferences';
import type { JourneyStep } from '../../../types';
import { jsonResponse } from './fixtures';

/*
 * O adaptador da Rybená é um singleton de módulo que, de verdade, busca o CDN
 * do fornecedor. Aqui ele é trocado por um falso cujos recibos o teste decide —
 * é o que permite provar o que o painel faz quando uma troca de modo falha.
 */
const rybena = vi.hoisted(() => {
  const accepted = (): RybenaReceipt => ({ status: 'accepted', state: 'ready', message: '' });
  const snapshot: RybenaSnapshot = {
    state: 'ready', mode: 'libras', message: '', attribution: '', attributionUrl: '', simulated: false,
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: () => () => undefined,
    initialize: vi.fn(async () => accepted()),
    setMode: vi.fn(async () => accepted()),
    open: vi.fn(async () => accepted()),
    close: vi.fn(async () => accepted()),
    translate: vi.fn(async () => accepted()),
    pause: vi.fn(async () => accepted()),
    resume: vi.fn(async () => accepted()),
    stop: vi.fn(async () => accepted()),
    setSpeed: vi.fn(async () => accepted()),
  };
});
vi.mock('../adapters/libras/selection', () => ({ librasAdapter: rybena }));

// Importado depois do `vi.mock`, que é içado para o topo do arquivo.
const { AccessibilityPanel } = await import('../ui/AccessibilityPanel');

type Handler = (request: PlannerRequest) => Response | Promise<Response>;

/** Monta um plano que o executor aceita: ecoa revisão, etapa e sessão do pedido. */
const planFrom = (request: PlannerRequest, overrides: Partial<PlannerResponse>): PlannerResponse => ({
  contractVersion: request.contractVersion,
  requestId: request.requestId,
  planId: 'plan-test',
  baseStateRevision: request.context.stateRevision,
  pageEpoch: request.context.pageEpoch,
  panelSession: request.context.panelSession,
  mode: 'apply',
  message: 'Feito.',
  actions: [{ type: 'set_preferences', patch: { textScale: 1.25 } }],
  ...overrides,
});

const routeApi = (routes: { plan?: Handler; explain?: (body: { requestId: string; contractVersion: string }) => Response }) => {
  const fetchMock = vi.fn(async (input: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    if (input.endsWith('/plan') && routes.plan) return routes.plan(body);
    if (input.endsWith('/explain') && routes.explain) return routes.explain(body);
    throw new Error(`rota inesperada no teste: ${input}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const baseProps = () => ({
  canUndo: false,
  getPreferences: () => getDefaultPreferences(),
  getStateRevision: () => 0,
  onApply: vi.fn(() => true),
  onClose: vi.fn(),
  onReset: vi.fn(() => true),
  onUndo: vi.fn(() => true),
  page: 'search' as JourneyStep,
  pageEpoch: 1,
  panelSession: 1,
  preferences: getDefaultPreferences(),
  stateRevision: 0,
  storageAvailable: true,
});

const renderPanel = (overrides: Partial<ReturnType<typeof baseProps>> = {}) => {
  const props = { ...baseProps(), ...overrides };
  const utils = render(<AccessibilityPanel {...props} />);
  return {
    ...utils,
    props,
    rerenderWith: (next: Partial<ReturnType<typeof baseProps>>) =>
      utils.rerender(<AccessibilityPanel {...props} {...next} />),
  };
};

const ask = async (text: string) => {
  const user = userEvent.setup();
  const field = screen.getByRole('textbox', { name: /fale com o assistente/i });
  await user.clear(field);
  await user.type(field, text);
  await user.click(screen.getByRole('button', { name: /enviar/i }));
};

const turns = (container: HTMLElement) =>
  [...container.querySelectorAll('.a11y-chat__turn')].map((turn) => turn.querySelector('p')?.textContent ?? '');

const statusBand = (container: HTMLElement) => container.querySelector('.assistant-message')?.textContent ?? '';

beforeEach(() => {
  for (const method of Object.values(rybena)) if (vi.isMockFunction(method)) method.mockClear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('vistas da raiz', () => {
  test('abre no assistente, com a chave marcando a vista ativa', () => {
    const { container } = renderPanel();
    expect(screen.getByRole('button', { name: 'Assistente' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Recursos' })).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelector('#a11y-card-libras')).toBeNull();
    expect(screen.getByRole('textbox', { name: /fale com o assistente/i })).toBeInTheDocument();
  });

  test('a chave troca para os recursos e o chat cede o lugar', async () => {
    const { container } = renderPanel();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Recursos' }));
    expect(screen.getByRole('button', { name: 'Recursos' })).toHaveAttribute('aria-pressed', 'true');
    for (const card of ['libras', 'voice', 'settings', 'about']) {
      expect(container.querySelector(`#a11y-card-${card}`)).not.toBeNull();
    }
    expect(screen.queryByRole('textbox', { name: /fale com o assistente/i })).toBeNull();
  });

  test('o foco de abertura mora na chave, que está sempre na tela', () => {
    const { container } = renderPanel();
    const entry = container.querySelector('[data-a11y-entry]');
    expect(entry).toBe(screen.getByRole('button', { name: 'Assistente' }));
  });

  test('a frase de escopo é lida junto com o campo', () => {
    renderPanel();
    const field = screen.getByRole('textbox', { name: /fale com o assistente/i });
    expect(field).toHaveAccessibleDescription(/só ajusto a leitura desta página/i);
  });
});

describe('glossário local', () => {
  test('pergunta de dicionário conhecida é respondida sem tocar a rede', async () => {
    const fetchMock = routeApi({});
    const { container } = renderPanel();
    await ask('o que é viação?');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(turns(container)).toEqual(['o que é viação?', 'É a empresa responsável por operar a viagem de ônibus.']);
  });

  test('a resposta vem como fala do assistente, sem selo de procedência', async () => {
    routeApi({});
    const { container } = renderPanel();
    await ask('o que é embarque?');
    expect(container.textContent).not.toMatch(/protótipo/i);
    expect(container.textContent).not.toMatch(/sem uso de IA/i);
    expect(statusBand(container)).toBe('');
  });

  test('"desembarque" recebe a própria definição, não a de "embarque"', async () => {
    routeApi({});
    const { container } = renderPanel();
    await ask('o que é desembarque?');
    expect(turns(container).at(-1)).toBe('É o momento e o local em que você sai do ônibus.');
  });

  test('o histórico mostra só as quatro falas mais recentes', async () => {
    routeApi({});
    const { container } = renderPanel();
    await ask('o que é viação?');
    await ask('o que é embarque?');
    await ask('o que é terminal?');
    expect(turns(container)).toHaveLength(4);
    expect(turns(container)[0]).toBe('o que é embarque?');
  });
});

describe('respostas vindas da IA', () => {
  const explainFromAi = () => routeApi({
    plan: (request) => jsonResponse(planFrom(request, {
      message: 'Vou explicar esse termo.',
      actions: [{ type: 'explain_term', term: 'overbooking' }],
    })),
    explain: ({ requestId, contractVersion }) => jsonResponse({
      contractVersion, requestId, text: 'É quando mais bilhetes são vendidos do que os assentos.',
    }),
  });

  test('a ressalva fica dentro do turno, na região viva', async () => {
    explainFromAi();
    const { container } = renderPanel();
    await ask('o que é overbooking?');
    const log = container.querySelector('.a11y-chat__log');
    expect(log).toHaveAttribute('aria-live', 'polite');
    const caveat = await within(log as HTMLElement).findByText('Confira esta explicação antes de usar.');
    expect(caveat.closest('.a11y-chat__turn')).toHaveTextContent('assentos');
  });

  test('a ressalva não se separa da resposta ao trocar de etapa', async () => {
    explainFromAi();
    const { container, rerenderWith } = renderPanel();
    await ask('o que é overbooking?');
    await within(container).findByText('Confira esta explicação antes de usar.');
    rerenderWith({ pageEpoch: 2, page: 'results' });
    expect(within(container).getByText('Confira esta explicação antes de usar.')).toBeInTheDocument();
    expect(turns(container).at(-1)).toMatch(/assentos/);
  });

  test('o campo de exibição `fromAi` não vai para o planejador', async () => {
    const fetchMock = explainFromAi();
    renderPanel();
    await ask('o que é overbooking?');
    await screen.findByText('Confira esta explicação antes de usar.');
    await ask('e o que é stand-by?');
    const planCalls = fetchMock.mock.calls.filter(([url]) => url.endsWith('/plan'));
    const history = JSON.parse(String(planCalls.at(-1)?.[1].body)).history as Record<string, unknown>[];
    expect(history.length).toBeGreaterThan(0);
    for (const turn of history) expect(Object.keys(turn).sort()).toEqual(['content', 'role']);
  });

  test('resposta do glossário não recebe a ressalva', async () => {
    routeApi({});
    renderPanel();
    await ask('o que é conexão?');
    expect(screen.queryByText('Confira esta explicação antes de usar.')).toBeNull();
  });
});

describe('proposta e recusa', () => {
  test('a proposta traz a explicação dentro do cartão, fora do fluxo com teto', async () => {
    routeApi({
      plan: (request) => jsonResponse(planFrom(request, {
        mode: 'propose',
        message: 'Posso deixar a leitura mais confortável.',
        actions: [{ type: 'apply_comfortable_reading' }],
      })),
    });
    const { container } = renderPanel();
    await ask('deixa mais confortável');
    const card = await waitFor(() => {
      const found = container.querySelector('.assistant-proposal');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(card).toHaveAttribute('role', 'status');
    expect(card).toHaveTextContent('Posso deixar a leitura mais confortável.');
    expect(container.querySelector('.a11y-chat__stream')?.contains(card)).toBe(false);
    expect(within(card).getByRole('button', { name: 'Aplicar proposta' })).toBeInTheDocument();
    expect(statusBand(container)).toBe('');
  });

  test('a recusa carrega o escopo escrito por nós, não só o texto do modelo', async () => {
    routeApi({
      plan: (request) => jsonResponse(planFrom(request, {
        mode: 'unsupported', message: 'Não consigo fazer isso.', actions: [],
      })),
    });
    const { container } = renderPanel();
    await ask('compre uma passagem para mim');
    await waitFor(() => expect(turns(container).at(-1)).toMatch(/Só ajusto a leitura desta página/));
    expect(turns(container).at(-1)).toMatch(/^Não consigo fazer isso\./);
  });
});

describe('falhas do serviço de IA', () => {
  test.each([
    ['indisponível', 503, { code: 'provider_unconfigured' }],
    ['ocupado', 502, { code: 'provider_http_429' }],
    ['limite do site', 429, {}],
  ])('serviço %s oferece o atalho para os recursos', async (_caso, status, body) => {
    routeApi({ plan: () => jsonResponse(body, status) });
    const { container } = renderPanel();
    await ask('aumente o texto');
    const shortcut = await screen.findByRole('button', { name: /ver os recursos de acessibilidade/i });
    await userEvent.setup().click(shortcut);
    expect(container.querySelector('#a11y-card-libras')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Recursos' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('falha de rede não oferece o atalho: não é o serviço que está fora', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const { container } = renderPanel();
    await ask('aumente o texto');
    await waitFor(() => expect(statusBand(container)).toMatch(/Não foi possível acessar o serviço de IA/));
    expect(screen.queryByRole('button', { name: /ver os recursos de acessibilidade/i })).toBeNull();
  });

  test('um pedido novo apaga o atalho do erro anterior', async () => {
    routeApi({ plan: () => jsonResponse({ code: 'provider_unconfigured' }, 503) });
    renderPanel();
    await ask('aumente o texto');
    await screen.findByRole('button', { name: /ver os recursos de acessibilidade/i });
    await ask('o que é viação?');
    expect(screen.queryByRole('button', { name: /ver os recursos de acessibilidade/i })).toBeNull();
  });
});

describe('cartões da Rybená', () => {
  const openCard = async (name: 'libras' | 'voice') => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Recursos' }));
    await user.click(document.querySelector(`#a11y-card-${name}`) as HTMLElement);
  };

  test('troca de modo recusada não segue para abrir o player', async () => {
    // O recibo de `setMode` era descartado: a troca falhava, o painel abria o
    // player mesmo assim e anunciava sucesso.
    rybena.setMode.mockResolvedValueOnce({ status: 'failed', state: 'failed', message: 'A Rybená recusou a troca.' });
    const { container } = renderPanel();
    await openCard('voice');
    await waitFor(() => expect(statusBand(container)).toBe('A Rybená recusou a troca.'));
    expect(rybena.setMode).toHaveBeenCalledWith('voz');
    expect(rybena.open).not.toHaveBeenCalled();
  });

  test('troca aceita abre o player no modo pedido', async () => {
    const { container } = renderPanel();
    await openCard('libras');
    await waitFor(() => expect(rybena.open).toHaveBeenCalledTimes(1));
    expect(rybena.setMode).toHaveBeenCalledWith('libras');
    expect(statusBand(container)).toMatch(/tradução em Libras/);
  });

  test('player que não carrega interrompe antes de trocar de modo', async () => {
    rybena.initialize.mockResolvedValueOnce({ status: 'failed', state: 'failed', message: 'Não foi possível carregar a Rybená.' });
    const { container } = renderPanel();
    await openCard('libras');
    await waitFor(() => expect(statusBand(container)).toBe('Não foi possível carregar a Rybená.'));
    expect(rybena.setMode).not.toHaveBeenCalled();
  });
});
