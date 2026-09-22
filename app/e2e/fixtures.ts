import { test as base } from '@playwright/test';

/**
 * `test` com a rolagem suave desligada. Todo arquivo de teste importa daqui.
 *
 * A raiz do app usa `scroll-behavior: smooth`, e a cada troca de etapa o app
 * move o foco para o `<main>` — o que dispara uma rolagem animada. O Playwright
 * clicava no botão seguinte enquanto a página ainda deslizava, e o clique caía
 * em coordenadas velhas: "Escolher viagem" não navegava e o teste esperava a
 * etapa de assentos até estourar o tempo. Aparecia só sob carga, no WebKit,
 * mais ou menos uma vez a cada três execuções completas.
 *
 * É artefato de robô — uma pessoa clica depois de ver a página, com a rolagem
 * terminada —, então a correção é aqui e não no app. Só a rolagem suave sai.
 * Emular `prefers-reduced-motion` também resolveria, mas desligaria todas as
 * animações e faria a suíte parar de cobrir a experiência padrão, que é a da
 * maioria das pessoas.
 */
export const test = base.extend<{ instantScrolling: void }>({
  instantScrolling: [async ({ page }, use) => {
    // No momento em que o script de inicialização roda, `document.documentElement`
    // ainda é nulo — em todos os motores. A primeira versão deste fixture fazia
    // `document.documentElement.append` e lançava erro sempre: a rolagem suave
    // nunca era desligada. No Chromium o erro ficava isolado; no WebKit ele
    // derrubava os scripts de inicialização seguintes, e o `withPreferences`
    // parava de gravar as preferências. Por isso a injeção espera o documento
    // existir e nunca lança.
    await page.addInitScript(() => {
      const inject = () => {
        if (document.querySelector('style[data-e2e="rolagem-instantanea"]')) return;
        const style = document.createElement('style');
        style.dataset.e2e = 'rolagem-instantanea';
        style.textContent = ':root { scroll-behavior: auto !important; }';
        (document.head ?? document.documentElement)?.append(style);
      };
      try {
        if (document.documentElement) inject();
        else document.addEventListener('DOMContentLoaded', inject, { once: true });
      } catch {
        // Um erro aqui interromperia os scripts de inicialização seguintes no WebKit.
      }
    });
    await use();
  }, { auto: true }],
});

export { expect } from '@playwright/test';
