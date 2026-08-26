# Aplicação do MVP

Frontend React + TypeScript criado com Vite. Todo o fluxo usa dados locais e pode ser demonstrado sem backend.

## Comandos

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
pnpm preview
```

O servidor local usa `http://127.0.0.1:4173/`.

## Fluxo principal

1. buscar São Paulo → Rio de Janeiro;
2. escolher uma viagem fictícia;
3. selecionar o assento 54 ou outro assento livre;
4. preencher os dados fictícios do passageiro;
5. concluir a simulação sem pagamento.

As preferências de acessibilidade são salvas no `localStorage` com a chave `clickbus-a11y-v1`.

