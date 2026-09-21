import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { goToStep, openPanel, stubApi, withPreferences } from './support';

/*
 * Verificação automática contra WCAG 2.1 A e AA. Ela cobre só uma parte dos
 * critérios — o "Sobre" do próprio painel diz isso —, então passar aqui não é
 * conformidade comprovada. O que ela garante é que nenhuma regressão que o axe
 * sabe detectar entra sem ser vista, em nenhuma etapa da jornada.
 */
const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const audit = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  // A mensagem de falha lista regra, impacto e alvo: é o que se precisa para
  // corrigir, e o que um relatório de "N violações" esconderia.
  const resumo = violations.map((violation) =>
    `${violation.id} (${violation.impact}) — ${violation.help}\n` +
    violation.nodes.slice(0, 3).map((node) => `    ${node.target.join(' ')}`).join('\n'));
  expect(resumo, resumo.join('\n\n')).toEqual([]);
};

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test.describe('jornada', () => {
  for (const step of ['search', 'results', 'seats', 'checkout', 'confirmation'] as const) {
    test(`etapa "${step}" sem violações automáticas de WCAG AA`, async ({ page }) => {
      await goToStep(page, step);
      await audit(page);
    });
  }

  test('o formulário do passageiro continua acessível depois de erros de validação', async ({ page }) => {
    await goToStep(page, 'checkout');
    await page.getByRole('button', { name: /concluir simulação/i }).click();
    await expect(page.getByLabel('Nome completo')).toHaveAttribute('aria-invalid', 'true');
    await audit(page);
  });
});

test.describe('painel de acessibilidade', () => {
  test('vista do assistente', async ({ page }) => {
    await page.goto('/');
    await openPanel(page);
    await audit(page);
  });

  test('vista de recursos', async ({ page }) => {
    await page.goto('/');
    await openPanel(page);
    await page.getByRole('button', { name: 'Recursos' }).click();
    await audit(page);
  });

  test('superfície de ajustes visuais', async ({ page }) => {
    await page.goto('/');
    await openPanel(page);
    await page.getByRole('button', { name: 'Recursos' }).click();
    await page.locator('#a11y-card-settings').click();
    await audit(page);
  });

  test('com alto contraste e texto a 150%', async ({ page }) => {
    await withPreferences(page, { contrast: 'high', textScale: 1.5 });
    await page.goto('/');
    await openPanel(page);
    await audit(page);
  });
});
