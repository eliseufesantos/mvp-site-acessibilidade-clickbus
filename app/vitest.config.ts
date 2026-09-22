import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Configuração própria dos testes, separada do `vite.config.ts`: aquele monta o
 * middleware da API, que nenhum teste precisa e que carregaria o servidor em
 * cada arquivo.
 *
 * O ambiente padrão é `node`. Testes que renderizam componentes declaram
 * `// @vitest-environment jsdom` no topo do próprio arquivo — assim a lógica
 * pura não paga o custo de subir um DOM, e fica explícito quem depende dele.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['src/test-setup.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/tests/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      reporter: ['text-summary', 'text'],
    },
  },
});
