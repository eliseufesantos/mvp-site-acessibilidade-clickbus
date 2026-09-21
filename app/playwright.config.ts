import { defineConfig, devices } from '@playwright/test';

/**
 * Testes em navegador de verdade, para o que o jsdom não enxerga: geometria.
 * O jsdom não calcula layout — `getBoundingClientRect` devolve zero —, então
 * cabeçalho esticado, folha fora do lugar e botão fora da tela passam
 * despercebidos nos testes de componente.
 *
 * Três projetos, porque os defeitos desta base apareceram em lugares
 * diferentes: desktop, celular no Chromium e celular no WebKit, o motor do
 * Safari — onde a trava de rolagem e o teclado virtual deram trabalho.
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
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npx vite --configLoader runner',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
