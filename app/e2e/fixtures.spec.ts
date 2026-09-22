import { expect, test } from './fixtures';
import { stubApi, withPreferences } from './support';

/*
 * Checa a própria infraestrutura dos testes. A primeira versão do fixture de
 * rolagem lançava erro em silêncio: a rolagem suave nunca era desligada e, no
 * WebKit, as preferências gravadas por `withPreferences` deixavam de valer.
 * Todo teste que dependia de texto a 150% passava a medir outra coisa, sem
 * nenhum aviso de que a montagem estava quebrada.
 */
test('o fixture desliga a rolagem suave sem impedir os outros scripts de inicialização', async ({ page }) => {
  await stubApi(page);
  await withPreferences(page, { textScale: 1.5 });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await expect(page.locator('html')).toHaveAttribute('data-text-scale', '1.5');
});
