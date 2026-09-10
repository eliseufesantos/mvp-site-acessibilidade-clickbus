# Plano de implementação — Acessibilidade Assistida por IA

Versão 2.0 · 9 de setembro de 2026.

## 1. Regras

1. Preservar a réplica, identidade, mudanças existentes e dados fictícios.
2. Implementar funções discretas; a LLM não gera CSS/JS nem recebe ferramentas de navegador.
3. Controles manuais funcionam sem IA ou Rybená.
4. Doubles existem apenas nos testes e nunca produzem tradução aparente na demonstração.
5. Não reabrir autorização comercial Rybená. Registrar somente configuração técnica ausente.
6. Não adicionar compra, reserva, pagamento, cancelamento ou navegação comercial ao agente.
7. Segredos ficam no servidor; endpoint pago permanece desativado sem proteção.
8. Atualizar evidências com resultados reais; não marcar bloqueios externos como `PASS`.
9. Não fazer deploy ou commit sem solicitação.

## 2. Sequência

### A — Baseline e especificações

- ler documentos, código, mudanças pendentes e mapeamento;
- executar typecheck/build existentes e registrar falhas preexistentes;
- auditar Rybená/VLibras e classificar código;
- atualizar PRD, SDD, este plano e validação antes do código.

Aceite: documentos v2 distinguem autorização comercial, acesso técnico, integração real, preparação e doubles.

### B — Contratos, store e ferramentas manuais

- implementar schemas runtime fechados;
- criar store v3 com migração v1/v2, revisão, storage tolerante e undo;
- implementar escala, contraste, controles, cursor, links, títulos, letras, entrelinha, alinhamento, guia, máscara, movimento e preset;
- criar registro fechado de conteúdo e adaptador genérico de Libras;
- substituir tentativa Rybená por adaptador indisponível sem rede.

Aceite: ajustes independentes/combinados, migração, persistência, no-op, desfazer e indisponibilidade passam em testes.

### C — Planejador e executor

- criar executor transacional, idempotente, com recibos e revisão;
- criar contratos/clientes distintos para plano, explicação e simplificação;
- criar backend desabilitado por padrão e adaptador de provedor configurável;
- aplicar pedido explícito; propor pedido vago; recusar escopo comercial/código;
- cancelar requisição anterior e descartar resposta tardia/duplicada.

Aceite: schema inválido, ação desconhecida, revisão obsoleta, duplicação, timeout e indisponibilidade não causam efeitos.

### D — Rybená preparada

- manter `LibrasAdapter` independente do fornecedor;
- exibir `unavailable_pending_provider_configuration` como estado estável;
- preservar crédito/link e remover carregamento especulativo;
- documentar credenciais, endpoints, IDs, versão, player, domínio/CORS, homologação, métodos/eventos e teste necessários;
- criar `TestLibrasAdapter` apenas se necessário para testes do executor.

Aceite: nenhuma requisição Rybená/VLibras no runtime; UI informa limitação sem quebrar o painel.

### E — Explicação e simplificação

- glossário determinístico para termos revisados;
- escolha por lista/teclado e seleção restrita por mouse;
- resultado separado e original preservado;
- backend opcional para conteúdo fora do glossário e simplificação;
- garantir que respostas nunca entrem no executor.

Aceite: limites, conteúdo proibido e prompt injection não alteram interface nem inventam condições.

### F — Voz

- detectar suporte real;
- iniciar/parar explicitamente, mostrar microfone ativo e permitir edição;
- exigir confirmação antes do envio;
- abortar ao fechar e manter alternativa textual.

Aceite: navegador sem suporte não quebra; fechamento impede envio tardio.

### G — Validação e documentação

- testes unitários do core e contratos;
- typecheck/build;
- navegador desktop, mobile 390×844, 320 px e zoom/reflow;
- teclado, foco, painel, jornada e console/rede;
- atualizar relatório de validação, README e roteiro de demonstração.

## 3. Registro da entrega

| Etapa | Estado em 09/09/2026 | Evidência inicial | Limitação |
| --- | --- | --- | --- |
| A | Concluída | leitura e auditoria; `tsc`/Vite diretos passam | scripts `pnpm` tentam reinstalar sem TTY/rede |
| B | Concluída | store v3, ferramentas, conteúdo e adaptador; testes | — |
| C | Estrutura concluída | contratos, cliente, endpoint e executor testados | modelo/credencial não configurados; avaliação real `NOT RUN` |
| D | Preparação concluída | porta genérica, estado estável, crédito e zero rede | API Rybená não liberada/configurada; operação real `BLOCKED` |
| E | Parcial nos limites disponíveis | glossário e isolamento aprovados; 503 seguro observado | explicação fora do glossário/simplificação real dependem de provedor |
| F | Implementada | detecção, captura explícita, edição e abort no fechamento | permissão/microfone real não executados |
| G | Concluída para o escopo local | TypeScript, build, 11 testes e navegador desktop/mobile, inclusive 320×844 CSS px | NVDA, zoom 200% e pesquisa humana pendentes |

### Baseline registrado

- Node `v22.22.0`; pnpm `11.12.0`.
- `pnpm typecheck` e `pnpm build`: falha ambiental antes do script (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` e tentativa de registry).
- `node_modules/.bin/tsc --noEmit -p tsconfig.app.json`: PASS.
- `node_modules/.bin/vite build --configLoader runner`: PASS, 1.614 módulos.
- `node scripts/run-accessibility-tests.mjs`: PASS, 11 testes.
- navegador integrado: PASS em 1265×711 e 378×629; sem overflow horizontal, `scrollTop=0` na troca de aba e zero recursos Rybená/VLibras.
- captura headless via CDP: PASS em 320×844 CSS px; `innerWidth`, `clientWidth` e `scrollWidth` iguais a 320, painel aberto com 320 px e acionador totalmente dentro do viewport.

### Arquivos principais entregues

- `src/features/accessibility-agent/core/`: preferências, contratos, cliente e executor;
- `src/features/accessibility-agent/adapters/`: registro ClickBus e porta/estado Rybená;
- `src/features/accessibility-agent/ui/`: conversa, ajustes, conteúdo e voz;
- `server/accessibility/` e `api/accessibility/`: limite servidor e handlers;
- `src/features/accessibility-agent/tests/run.ts`: regressão do núcleo;
- `docs/accessibility-agent/concepts/`: três conceitos aceitos como referência.
- `scripts/capture-accessibility-evidence.mjs` e `docs/accessibility-agent/evidence/`: captura reproduzível e imagens reais em 320×844.

## 4. Roteiro de demonstração atualizado

1. Abrir o painel por teclado e mostrar preferências ativas.
2. Aplicar ajustes manuais em categorias, combinar e desfazer.
3. Enviar pedido explícito; se IA não estiver configurada, mostrar indisponibilidade e continuar manualmente.
4. Enviar pedido vago com planejador configurado/double de teste identificado; revisar proposta antes de aplicar.
5. Explicar um termo do glossário e simplificar trecho público, mantendo original.
6. Demonstrar voz somente após consentimento de microfone; editar antes de enviar.
7. Abrir área Rybená e mostrar atribuição + estado aguardando liberação técnica, sem tradução simulada.
8. Percorrer busca → resultados → assento e confirmar que preferências não mudam o estado comercial.

Não encenar integração LLM ou Rybená real sem configuração e evidência.
