# Continuar o projeto

Este é o ponto de entrada recomendado para retomar o trabalho em outra sessão ou ferramenta.

## Estado atual

- A aplicação fica em `app/` e está funcional.
- O fluxo principal vai da busca até uma confirmação simulada.
- Alto contraste, modo idoso e redução de movimento são preferências globais persistentes.
- O projeto não possui backend nem pagamento real.
- O build de produção e a jornada em desktop/mobile foram validados em 26/08/2026.

## Primeiro diagnóstico

```bash
git status --short --branch
cd app
pnpm install
pnpm typecheck
pnpm build
pnpm dev
```

Acesse `http://127.0.0.1:4173/`.

## Ordem de leitura

1. `01-ARQUITETURA.md`
2. `02-DESIGN-SYSTEM.md`
3. `03-ACESSIBILIDADE.md`
4. `04-FLUXO-E-DADOS.md`
5. `05-DESENVOLVIMENTO.md`
6. `06-QA.md`
7. `07-RESUMO-IMPLEMENTACAO.md`
8. `08-DEPLOY-VERCEL.md`

## Próximos incrementos possíveis

- criar testes automatizados de componentes e fluxo;
- validar com leitor de tela real (NVDA/VoiceOver);
- ligar a busca a uma API mockada;
- criar página de comparação “antes e depois” para a apresentação;
- executar auditoria Lighthouse/axe e documentar os resultados.

Mantenha o caráter acadêmico visível: dados, horários, preços e passageiros são fictícios.
