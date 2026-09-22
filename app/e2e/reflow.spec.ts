import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { goToStep, openPanel, stubApi, withPreferences } from './support';

/*
 * Reflow, critério 1.4.10 da WCAG 2.1 (AA): o conteúdo precisa funcionar em
 * 320 CSS px sem rolagem nas duas direções. O axe não verifica isso, e os
 * testes de layout do painel só mediam vazamento com o painel aberto — as
 * páginas da jornada nunca eram medidas.
 *
 * Roda em todos os projetos, mas é no `mobile-320` que ele morde. O pior caso
 * é o texto a 150% com alto contraste, que o AGENTS.md registra como validado
 * à mão em 19/09.
 */
const STEPS = ['search', 'results', 'seats', 'checkout', 'confirmation'] as const;

/** Largura que sobra além da viewport. Positivo é rolagem horizontal. */
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** O que passa da borda direita, para a falha dizer onde está o vazamento. */
const offenders = (page: Page) => page.evaluate(() => [...document.querySelectorAll('body *')]
  .filter((element) => {
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.right > document.documentElement.clientWidth + 1;
  })
  .slice(0, 5)
  .map((element) => `${element.tagName.toLowerCase()}.${element.className.toString().split(' ')[0]}`));

/**
 * Espera a página assentar antes de medir. Sem isto a medição saía
 * intermitente: a Rubik chega por `@fontsource`, de forma assíncrona, e medir
 * antes dela — ou no meio de uma animação de entrada — mede outra largura.
 * Animações infinitas ficam de fora, porque a promessa delas nunca resolve.
 */
const settle = (page: Page) => page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all(document.getAnimations()
    .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map((animation) => animation.finished.catch(() => undefined)));
});

const expectNoReflowLoss = async (page: Page) => {
  await settle(page);
  const overflow = await horizontalOverflow(page);
  expect(overflow, `rolagem horizontal de ${overflow}px; passam da borda: ${(await offenders(page)).join(', ')}`)
    .toBeLessThanOrEqual(0);
};

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

for (const step of STEPS) {
  test(`etapa "${step}" sem rolagem horizontal`, async ({ page }) => {
    await goToStep(page, step);
    await expectNoReflowLoss(page);
  });

  test(`etapa "${step}" sem rolagem horizontal com texto a 150% e alto contraste`, async ({ page }) => {
    await withPreferences(page, { textScale: 1.5, contrast: 'high' });
    await goToStep(page, step);
    await expect(page.locator('html')).toHaveAttribute('data-text-scale', '1.5');
    await expectNoReflowLoss(page);
  });
}

test('painel aberto com texto a 150% sem rolagem horizontal', async ({ page }) => {
  await withPreferences(page, { textScale: 1.5, contrast: 'high' });
  await page.goto('/');
  await openPanel(page);
  await expectNoReflowLoss(page);
});
