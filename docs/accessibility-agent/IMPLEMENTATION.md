# Plano de implementação — Acessibilidade Assistida por IA

Versão 2.1 · 14 de setembro de 2026.

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
- escolha por lista/teclado e modo explícito de seleção restrita por mouse/toque;
- resultado separado e original preservado;
- simplificações locais revisadas para os alvos iniciais;
- backend opcional para termos fora do glossário e alvos autorizados sem versão simples local;
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

| Etapa | Estado em 14/09/2026 | Evidência | Limitação |
| --- | --- | --- | --- |
| A | Concluída | leitura e auditoria; `tsc`/Vite diretos passam | scripts `pnpm` tentam reinstalar sem TTY/rede |
| B | Concluída | store v3, ferramentas, conteúdo e adaptador; testes | — |
| C | Estrutura concluída | contratos, cliente, endpoint e executor testados | modelo/credencial não configurados; avaliação real `NOT RUN` |
| D | Preparação concluída | porta genérica, estado estável, crédito e zero rede | API Rybená não liberada/configurada; operação real `BLOCKED` |
| E | Concluída no escopo local | seleção real na página, glossário e simplificação local aprovados; original preservado | explicação fora do glossário e fallback remoto `NOT RUN`, pois o provedor não está configurado |
| F | Implementada | detecção, captura explícita, edição e abort no fechamento | permissão/microfone real não executados |
| G | Concluída para o escopo local automatizado | TypeScript, build e 13 testes aprovados; navegador desktop/mobile exercitado | NVDA, zoom 200% e pesquisa humana pendentes |

### Baseline registrado

- Node `v22.22.0`; pnpm `11.12.0`.
- `pnpm typecheck` e `pnpm build`: falha ambiental antes do script (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` e tentativa de registry).
- `node_modules/.bin/tsc --noEmit -p tsconfig.app.json`: PASS.
- `node_modules/.bin/vite build --configLoader runner`: PASS, 1.616 módulos.
- `node scripts/run-accessibility-tests.mjs`: PASS, 13 testes.
- navegador integrado: PASS em 1440×900 e 390×844; acionador lateral fixo preservado na busca, nos resultados e nos assentos, drawer desktop não modal, diálogo mobile e ausência de erros/warnings no console.
- fluxo de Conteúdo no navegador: PASS para recolher o painel, selecionar termo em `search-help`, retornar com o campo preenchido/focado, explicar “viação” pelo glossário e simplificar localmente com o original preservado; no mobile 390×844, o bloqueio modal foi restaurado após a seleção.
- reflow da nova UI: PASS em 320×844, com `scrollWidth=clientWidth=320` no documento e no painel; a escala de texto a 150% permaneceu legível e sem overflow horizontal; o alto contraste também foi exercitado em mobile sem overflow.
- breakpoint responsivo: PASS em 820 px como diálogo com backdrop, `aria-modal="true"` e `body` bloqueado; PASS em 821 px como região não modal, sem backdrop e com `body` rolável; ambos sem overflow horizontal.

### Arquivos principais entregues

- `src/features/accessibility-agent/core/`: preferências, contratos, cliente e executor;
- `src/features/accessibility-agent/adapters/`: registro ClickBus e porta/estado Rybená;
- `src/features/accessibility-agent/ui/`: conversa, ajustes, conteúdo e voz;
- `src/components/accessibility/AccessibilityPlugin.tsx`: acionador fixo, superfície desktop/mobile, foco e modo de seleção;
- `src/styles/accessibility-plugin.css`: identidade visual e responsividade isoladas do plugin;
- `server/accessibility/` e `api/accessibility/`: limite servidor e handlers;
- `src/features/accessibility-agent/tests/run.ts`: regressão do núcleo;
- `scripts/capture-accessibility-evidence.mjs`: captura reproduzível em 320×844. As imagens antigas foram removidas; novas capturas devem ser revisadas antes de serem versionadas.

## 4. Roteiro de demonstração atualizado

1. Abrir o painel por teclado e mostrar preferências ativas.
2. Aplicar ajustes manuais em categorias, combinar e desfazer.
3. Enviar pedido explícito; se IA não estiver configurada, mostrar indisponibilidade e continuar manualmente.
4. Enviar pedido vago com planejador configurado/double de teste identificado; revisar proposta antes de aplicar.
5. Na aba Conteúdo, acionar “Selecionar na página”, marcar um termo em alvo identificado, revisar o campo preenchido, explicar pelo glossário e simplificar um trecho público localmente, mantendo o original.
6. Demonstrar voz somente após consentimento de microfone; editar antes de enviar.
7. Abrir área Rybená e mostrar atribuição + estado aguardando liberação técnica, sem tradução simulada.
8. Percorrer busca → resultados → assento e confirmar que preferências não mudam o estado comercial.

Não encenar integração LLM ou Rybená real sem configuração e evidência.
