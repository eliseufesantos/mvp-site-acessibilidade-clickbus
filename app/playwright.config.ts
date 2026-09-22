import { defineConfig, devices } from '@playwright/test';

/**
 * Testes em navegador de verdade, para o que o jsdom não enxerga: geometria.
 * O jsdom não calcula layout — `getBoundingClientRect` devolve zero —, então
 * cabeçalho esticado, folha fora do lugar e botão fora da tela passam
 * despercebidos nos testes de componente.
 *
 * Dois projetos: desktop e celular em 320 CSS px. O 320 é o limite do critério
 * de Reflow da WCAG 2.1 (1.4.10) e a meta de validação do AGENTS.md — foi nele
 * que o botão Filtros apareceu vazando da tela. Larguras intermediárias ficam
 * cobertas entre os dois extremos, e a fronteira exata entre celular e desktop
 * (820/821 px) tem teste próprio em `layout.spec.ts`.
 *
 * Já foram quatro, com Pixel 7 (412 px) e WebKit (iPhone 14). Saíram por
 * proporção: o WebKit concentrava a instabilidade sob carga paralela e, no
 * Windows, aproxima o motor do Safari mas não o aparelho — não há teclado
 * virtual real. Para um protótipo, o custo não se pagava.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-320', use: { ...devices['Pixel 7'], viewport: { width: 320, height: 844 } } },
  ],
  webServer: {
    command: 'npx vite --configLoader runner',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
