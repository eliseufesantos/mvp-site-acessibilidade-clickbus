import type { Page, Route } from '@playwright/test';
import {
  STORAGE_KEY,
  getDefaultPreferences,
  serializePreferences,
} from '../src/features/accessibility-agent/core/preferences';
import type { AccessibilityPreferences } from '../src/types';

/**
 * Grava preferências antes do primeiro script da página, usando o serializador
 * do próprio app. Montar o JSON à mão faria o teste passar a testar um formato
 * que o app talvez não use mais.
 */
export const withPreferences = async (page: Page, patch: Partial<AccessibilityPreferences>) => {
  const stored = serializePreferences({ ...getDefaultPreferences(), ...patch });
  await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [STORAGE_KEY, stored] as const);
};

/**
 * Nenhum teste de ponta a ponta fala com a Gemini nem com o CDN da Rybená. O
 * planejador responde o que o teste mandar; o resto da API é recusado de forma
 * explícita, para que uma chamada inesperada apareça como falha e não como
 * espera silenciosa.
 */
export const stubApi = async (page: Page, plan?: (request: PlannerRequestLike) => Record<string, unknown>) => {
  await page.route('**/api/accessibility/**', async (route: Route) => {
    const url = route.request().url();
    if (url.includes('/plan') && plan) {
      const request = route.request().postDataJSON() as PlannerRequestLike;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plan(request)) });
      return;
    }
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'provider_unconfigured' }) });
  });
};

export interface PlannerRequestLike {
  contractVersion: string;
  requestId: string;
  context: { stateRevision: number; pageEpoch: number; panelSession: number };
}

/** Plano que o executor aceita: ecoa revisão, etapa e sessão do pedido. */
export const planFrom = (request: PlannerRequestLike, overrides: Record<string, unknown>) => ({
  contractVersion: request.contractVersion,
  requestId: request.requestId,
  planId: 'plan-e2e',
  baseStateRevision: request.context.stateRevision,
  pageEpoch: request.context.pageEpoch,
  panelSession: request.context.panelSession,
  mode: 'apply',
  message: 'Feito.',
  actions: [],
  ...overrides,
});

export const openPanel = async (page: Page) => {
  await page.getByRole('button', { name: /^abrir acessibilidade/i }).click();
  const surface = page.locator('#accessibility-panel');
  await surface.waitFor({ state: 'visible' });
  // A entrada é animada. Medir no meio dela mede um quadro intermediário.
  await surface.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  return surface;
};

export const ask = async (page: Page, text: string) => {
  await page.getByRole('textbox', { name: /fale com o assistente/i }).fill(text);
  await page.getByRole('button', { name: /enviar/i }).click();
};

/** Percorre a jornada até a etapa pedida, pelos mesmos controles que a pessoa usa. */
export const goToStep = async (page: Page, step: 'search' | 'results' | 'seats' | 'checkout' | 'confirmation') => {
  await page.goto('/');
  if (step === 'search') return;
  await page.getByRole('button', { name: /buscar passagens/i }).click();
  await page.locator('main[data-page="results"]').waitFor();
  if (step === 'results') return;
  await page.getByRole('button', { name: /escolher viagem/i }).first().click();
  await page.locator('main[data-page="seats"]').waitFor();
  if (step === 'seats') return;
  await page.getByRole('button', { name: /^assento \d+, livre$/i }).first().click();
  await page.getByRole('button', { name: /^continuar/i }).click();
  await page.locator('main[data-page="checkout"]').waitFor();
  if (step === 'checkout') return;
  await page.getByLabel('Nome completo').fill('Pessoa de Teste');
  await page.getByLabel('CPF').fill('52998224725');
  await page.getByLabel('Data de nascimento').fill('01011990');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /concluir simulação/i }).click();
  await page.locator('main[data-page="confirmation"]').waitFor();
};
