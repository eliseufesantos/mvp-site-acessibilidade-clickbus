# Aplicação do MVP

Frontend React + TypeScript criado com Vite. A jornada comercial usa dados locais; os ajustes manuais e o glossário funcionam sem backend.

## Comandos

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
pnpm preview
pnpm test:accessibility
```

O servidor local usa `http://127.0.0.1:4173/`.

## Fluxo principal

1. buscar São Paulo → Rio de Janeiro;
2. escolher uma viagem fictícia;
3. selecionar um dos assentos livres do mapa da viagem;
4. preencher os dados fictícios do passageiro;
5. concluir a simulação sem pagamento.

As preferências independentes são salvas em `clickbus-a11y-v3`, com migração segura de v1/v2. O painel oferece conversa, ajustes e conteúdo. O texto livre vai somente para `/api/accessibility/plan`; o servidor permanece desativado sem `ACCESSIBILITY_LLM_ENDPOINT`, `ACCESSIBILITY_LLM_MODEL` e `ACCESSIBILITY_LLM_API_KEY`. O host `generativelanguage.googleapis.com` usa o adaptador REST nativo Gemini, sempre no servidor. Não existe parser por regex fingindo ser IA nem segredo no bundle.

A autorização de uso gratuito da Rybená está confirmada e o crédito é obrigatório. Nesta versão, o adaptador carrega o CDN somente após ação explícita, em modo API e sem polling ou retry automático. O fornecedor recusou o token/domínio no teste local; por isso a tradução real permanece bloqueada e não é simulada até autorização e homologação.

Detalhes: [`../docs/accessibility-agent/README.md`](../docs/accessibility-agent/README.md).
