import { expect, test } from './fixtures';
import { ask, goToStep, openPanel, planFrom, stubApi, withPreferences } from './support';

/*
 * Cada teste aqui corresponde a um defeito de geometria que já chegou ao
 * aparelho de alguém nesta base, e que nenhum teste de componente pegaria: o
 * jsdom não calcula layout.
 */

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test.describe('folha do painel no celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'comportamento exclusivo do celular');

  test('cobre a viewport exatamente, sem deslocamento lateral', async ({ page }) => {
    // A animação da gaveta de desktop deixava a folha em `left: -12px` no
    // celular, com a página aparecendo na faixa da direita.
    await page.goto('/');
    const surface = await openPanel(page);
    const viewport = page.viewportSize();
    const box = await surface.boundingBox();
    expect(box?.x).toBe(0);
    expect(box?.width).toBe(viewport?.width);
  });

  test('não cria rolagem horizontal no documento', async ({ page }) => {
    await page.goto('/');
    await openPanel(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('nenhum elemento do painel ultrapassa a borda da tela', async ({ page }) => {
    await page.goto('/');
    await openPanel(page);
    const vazando = await page.locator('#accessibility-panel *').evaluateAll((elements) => elements
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && (box.right > window.innerWidth + 1 || box.left < -1);
      })
      .map((element) => element.className.toString().slice(0, 40)));
    expect(vazando).toEqual([]);
  });
});

test.describe('altura do painel', () => {
  test('o cabeçalho não absorve a sobra de altura', async ({ page }) => {
    // Com o grid em `auto auto auto`, o `align-content` padrão distribuía a
    // sobra entre as linhas e o cabeçalho chegava a 270px.
    await page.goto('/');
    await openPanel(page);
    const box = await page.locator('.accessibility-panel__heading').boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeLessThanOrEqual(72);
  });

  test('na vista do assistente, campo e botão de envio aparecem sem rolar', async ({ page }) => {
    await page.goto('/');
    await openPanel(page);
    await expect(page.getByRole('textbox', { name: /fale com o assistente/i })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: /enviar/i })).toBeInViewport({ ratio: 1 });
  });

  test('com texto a 150% e alto contraste, o botão de envio continua alcançável', async ({ page }) => {
    // O pior caso da sessão: com a raiz em 24px, o log de altura fixa empurrava
    // o campo para fora e os cartões chegavam a sumir.
    await withPreferences(page, { textScale: 1.5, contrast: 'high' });
    await page.goto('/');
    await openPanel(page);
    await expect(page.locator('html')).toHaveAttribute('data-text-scale', '1.5');
    await expect(page.getByRole('button', { name: /enviar/i })).toBeInViewport({ ratio: 1 });
  });

  test('na vista de recursos, os quatro cartões aparecem sem rolar', async ({ page }) => {
    await page.goto('/');
    await openPanel(page);
    await page.getByRole('button', { name: 'Recursos' }).click();
    for (const card of ['libras', 'voice', 'settings', 'about']) {
      await expect(page.locator(`#a11y-card-${card}`)).toBeInViewport({ ratio: 1 });
    }
  });
});

test.describe('conversa', () => {
  test('uma troca curta encosta na base, perto do campo', async ({ page }) => {
    await page.goto('/');
    await openPanel(page);
    await ask(page, 'o que é embarque?');
    const ultimaFala = page.locator('.a11y-chat__turn').last();
    await expect(ultimaFala).toContainText('entra no ônibus');
    const fala = await ultimaFala.boundingBox();
    const campo = await page.locator('.a11y-chat__form').boundingBox();
    // Encostada: a distância até o campo é só o respiro, não um vão.
    expect((campo?.y ?? 0) - ((fala?.y ?? 0) + (fala?.height ?? 0))).toBeLessThan(48);
  });

  test('a proposta mostra a explicação e o botão de confirmar sem rolar', async ({ page }) => {
    // Dentro do fluxo com teto, um cartão alto empurrava a explicação para
    // baixo do corte: a pessoa via "Confirme" sem saber o motivo.
    await page.unroute('**/api/accessibility/**');
    await stubApi(page, (request) => planFrom(request, {
      mode: 'propose',
      message: 'Posso aumentar o texto, reforçar o contraste e ampliar o espaçamento entre as linhas.',
      actions: [{ type: 'apply_comfortable_reading' }, { type: 'set_libras_speed', speed: 0.75 }],
    }));
    await withPreferences(page, { textScale: 1.25 });
    await page.goto('/');
    await openPanel(page);
    await ask(page, 'deixa mais confortável para ler');
    const cartao = page.locator('.assistant-proposal');
    await expect(cartao).toContainText('Posso aumentar o texto');
    await expect(cartao.getByRole('button', { name: 'Aplicar proposta' })).toBeInViewport({ ratio: 1 });
    await expect(cartao.locator('p').first()).toBeInViewport({ ratio: 1 });
  });
});

test.describe('painel no desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'comportamento exclusivo do desktop');

  test('é uma região ao lado da página, não uma folha que a cobre', async ({ page }) => {
    await page.goto('/');
    const surface = await openPanel(page);
    const box = await surface.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.width).toBeLessThan((viewport?.width ?? 0) / 2);
    await expect(page.getByRole('region', { name: 'Painel de acessibilidade' })).toBeVisible();
  });
});

test.describe('fronteira entre celular e desktop', () => {
  // A fronteira é 820/821 px, registrada no AGENTS.md. O projeto de celular
  // tem 320 px e o de desktop tem 1280: sem este teste, um breakpoint
  // deslocado para 768 px passaria pelos dois.
  test.skip(({ isMobile }) => isMobile, 'a largura é fixada pelo próprio teste');

  test('em 820 px o painel é um diálogo modal que trava a página', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 900 });
    await page.goto('/');
    await openPanel(page);
    await expect(page.getByRole('dialog', { name: 'Painel de acessibilidade' })).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('.accessibility-plugin__backdrop')).toBeVisible();
    expect(await page.evaluate(() => document.body.style.position)).toBe('fixed');
  });

  test('em 821 px o painel é uma região ao lado, e a página continua rolável', async ({ page }) => {
    await page.setViewportSize({ width: 821, height: 900 });
    await page.goto('/');
    await openPanel(page);
    await expect(page.getByRole('region', { name: 'Painel de acessibilidade' })).toBeVisible();
    await expect(page.locator('.accessibility-plugin__backdrop')).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.position)).toBe('');
  });
});

test.describe('header fixo', () => {
  test('levar um elemento à vista não o deixa embaixo do header', async ({ page }) => {
    // O header é `sticky`. Sem folga de rolagem, alinhar um elemento pelo topo
    // o estacionava embaixo dele — a caixa de consentimento ficava coberta e o
    // clique caía no header. `behavior: 'instant'` porque a raiz tem rolagem
    // suave, e medir no meio da animação mede uma posição intermediária.
    await goToStep(page, 'checkout');
    const alvo = page.getByRole('checkbox');
    await alvo.evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'start' }));
    const header = await page.locator('.site-header').boundingBox();
    const box = await alvo.boundingBox();
    expect(box?.y).toBeGreaterThanOrEqual((header?.y ?? 0) + (header?.height ?? 0));
  });
});
