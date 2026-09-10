# Continuar o projeto

Este é o ponto de entrada recomendado para retomar o trabalho em outra sessão ou ferramenta.

## Evolução atual

Para continuar o agente de acessibilidade, começar pelo [PRD/SDD, registro de implementação e validação](../accessibility-agent/README.md). O núcleo e a UI estão implementados. A LLM real exige configuração de servidor; a Rybená tem autorização gratuita confirmada, mas ainda aguarda integração técnica e homologação.

## Estado atual

- A aplicação fica em `app/` e está funcional.
- O fluxo principal vai da busca até uma confirmação simulada.
- Preferências v3 independentes incluem contraste, quatro escalas, controles/cursor, destaques, letras, entrelinha, alinhamento, guia, máscara e movimento reduzido.
- O planejador usa contrato fechado e executor local idempotente; sem provedor configurado, responde 503 e mantém os controles manuais.
- Glossário local funciona; explicação fora do glossário e simplificação dependem do provedor.
- Entrada por voz é opcional e explícita; não foi concedida permissão de microfone durante a validação automatizada.
- Nenhum VLibras ou script Rybená é carregado. O bloco Rybená informa a pendência técnica e preserva o crédito.
- O projeto não possui pagamento real. Endpoints de acessibilidade estão preparados no servidor Vite/API.
- TypeScript, build e 11 testes do núcleo/servidor passaram em 09/09/2026; navegador integrado validado em 1265×711 e 378×629, com reflow adicional em 320×844 CSS px via CDP.

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
- configurar e avaliar um modelo real para o planejador;
- receber da Rybená o contrato técnico e homologar tradução/player com pessoas surdas sinalizantes;
- ligar a busca a uma API mockada;
- criar página de comparação “antes e depois” para a apresentação;
- executar auditoria Lighthouse/axe e documentar os resultados.

Dados, horários, preços e passageiros são fictícios. Não apresentar a IA ou a Rybená como operacionais antes das validações registradas.
