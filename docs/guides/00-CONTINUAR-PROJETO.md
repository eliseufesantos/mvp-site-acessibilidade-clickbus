# Continuar o projeto

Este é o ponto de entrada recomendado para retomar o trabalho em outra sessão ou ferramenta.

## Evolução atual

Para continuar o agente de acessibilidade, começar pelo [PRD/SDD, registro de implementação e validação](../accessibility-agent/README.md). O núcleo e a UI estão implementados. A LLM real exige configuração de servidor; a integração demonstrativa Rybená está implementada, mas ainda aguarda autorização de domínio/token e homologação.

## Estado atual

- A aplicação fica em `app/` e está funcional.
- O fluxo principal vai da busca até uma confirmação simulada.
- Preferências v3 independentes incluem contraste, quatro escalas, controles/cursor, destaques, letras, entrelinha, alinhamento, guia, máscara e movimento reduzido.
- O planejador usa contrato fechado e executor local idempotente; sem provedor configurado, responde 503 e mantém os controles manuais.
- Glossário e simplificações revisadas dos alvos iniciais funcionam localmente; somente casos autorizados sem resposta local dependem de provedor.
- Entrada por voz é opcional e explícita; não foi concedida permissão de microfone durante a validação automatizada.
- Nenhum VLibras é carregado. O script Rybená só entra após clique explícito; a recusa de domínio/token é informada e o crédito é preservado.
- O projeto não possui pagamento real. Endpoints de acessibilidade estão preparados no servidor Vite/API.
- TypeScript, build e 14 testes do núcleo passaram em 17/09/2026; a interface anterior foi validada em 1440×900, 390×844 e 320×844 CSS px.

## Primeiro diagnóstico

```bash
git status --short --branch
npx --yes pnpm@10.28.0 --dir app install --frozen-lockfile
npx --yes pnpm@10.28.0 --dir app typecheck
npx --yes pnpm@10.28.0 --dir app build
npx --yes pnpm@10.28.0 --dir app test:accessibility
npx --yes pnpm@10.28.0 --dir app dev
```

Acesse `http://127.0.0.1:4173/`.

## Ordem de leitura

1. `../RESUMO-PARA-APRESENTACAO.md`
2. `01-ARQUITETURA.md`
3. `02-DESIGN-SYSTEM.md`
4. `03-ACESSIBILIDADE.md`
5. `05-DESENVOLVIMENTO.md`
6. `../accessibility-agent/README.md`
7. `08-DEPLOY-VERCEL.md`

## Próximos incrementos possíveis

- ampliar os testes automatizados de componentes e fluxo;
- validar com leitor de tela real (NVDA/VoiceOver);
- configurar e avaliar um modelo real para o planejador;
- solicitar à Rybená a liberação do domínio/token e homologar tradução/player com pessoas surdas sinalizantes;
- ligar a busca a uma API mockada;
- criar página de comparação “antes e depois” para a apresentação;
- executar auditoria Lighthouse/axe e documentar os resultados.

Dados, horários, preços e passageiros são fictícios. Não apresentar a IA ou a Rybená como operacionais antes das validações registradas.
