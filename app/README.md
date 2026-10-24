# Aplicação do MVP

Frontend React + TypeScript com Vite, e o servidor das rotas de acessibilidade em `server/`. A jornada usa dados locais. Os ajustes manuais, o glossário e as simplificações revisadas funcionam sem backend.

## Comandos

```bash
pnpm install
pnpm dev           # http://127.0.0.1:4173/
pnpm typecheck
pnpm build
pnpm preview
pnpm test          # unidade e componente (Vitest)
pnpm test:e2e      # layout e acessibilidade em navegador real (Playwright)
pnpm test:all      # as duas camadas
```

Antes do primeiro `test:e2e`, baixe o navegador com `pnpm exec playwright install chromium`.

## Fluxo principal

1. buscar São Paulo → Rio de Janeiro;
2. escolher uma viagem fictícia;
3. selecionar um assento livre;
4. preencher os dados fictícios do passageiro;
5. concluir a simulação, sem pagamento.

Arquitetura, contratos e convenções estão em [`../docs/`](../docs/README.md).
