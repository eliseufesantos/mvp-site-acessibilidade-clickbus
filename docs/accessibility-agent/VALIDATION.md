# Validação — Acessibilidade Assistida por IA

Versão 2.2 · 17 de setembro de 2026.

## 1. Regra de evidência

Testes automatizados, navegador, integrações reais e avaliação humana são registrados separadamente. Doubles validam contratos e falhas, não inferência ou tradução reais. `PASS` só descreve comportamento efetivamente observado.

Estado Rybená: CDN e recusa real observados; **BLOCKED / NOT VALIDATED — provider domain or token not authorized** para tradução e reprodução.

## 2. Matriz funcional

| Caso | Verificação | Resultado esperado |
| --- | --- | --- |
| T01 | Abrir/fechar o plugin lateral por teclado | foco inicial correto, Escape e retorno ao acionador |
| T02 | Cada preferência | efeito real e discreto, conteúdo/estado preservado |
| T03 | Todas as preferências | reflow, foco e controles íntegros |
| T04 | Letras × entrelinha | ajustes independentes |
| T05 | Alinhamento original/esquerda/centro | só conteúdo aplicável muda |
| T06 | Guia e máscara com mouse/teclado | sem interceptar clique nem ocultar foco |
| T07 | Preset confortável | patch explícito; demais campos preservados |
| T08 | Desfazer e no-op | última transação efetiva restaurada uma vez |
| T09 | Migrar v1 e v2; storage inválido/bloqueado | v3 válido ou defaults; operação em memória |
| T10 | Pedido direto | somente ações apresentadas e válidas |
| T11 | Pedido vago/cancelar | nenhuma mudança antes de confirmar |
| T12 | Pedido relativo | usa estado atual e preserva resto |
| T13 | Ação/campo desconhecido | lote rejeitado antes de efeitos |
| T14 | Pedido comercial/código/prompt injection | nenhuma ferramenta proibida ou mutação comercial |
| T15 | Resposta tardia após ajuste/fechamento/navegação | descartada |
| T16 | Mesmo `planId` duas vezes | efeito único e recibo reutilizado |
| T17 | Timeout/IA desabilitada | erro finito; controles manuais disponíveis |
| T18 | Selecionar e explicar termo do glossário | painel recolhe; seleção fica no mesmo alvo público; campo/foco retornam; resposta revisada |
| T19 | Termo/regra não disponível | reconhece limite; não inventa tarifa/política |
| T20 | Simplificar alvo público | versão local revisada quando disponível; saída separada, sem substituir original |
| T21 | Simplificar conteúdo proibido/injeção | recusa; nenhuma ação visual |
| T22 | Voz suportada | iniciar/parar, indicador, edição e confirmação |
| T23 | Voz não suportada/fechar capturando | mensagem estável; captura abortada |
| T24 | Rybená não autorizada | carregamento sob demanda; mensagem e atribuição; sem retry automático; núcleo preservado |
| T25 | Jornada completa com preferências | busca/viagem/assento/passageiro preservados |
| T26 | 390×844, 320 px, texto 150% e zoom | sem overflow geral ou controles cortados |
| T27 | Chaves/bundle/logs | nenhum segredo ou conteúdo privado |
| T28 | Fechar painel durante requisição/proposta | preferências mantidas; operação invalidada |

T13–T17, T21, T24, T25 e proteção de credenciais são bloqueadores do núcleo.

## 3. Avaliação do planejador

Casos mínimos, executados contra modelo real somente após configuração:

- aumentar/diminuir texto nos limites;
- contraste normal/alto;
- controles/cursor/destaques;
- letras e entrelinha independentes;
- alinhamento, guia, máscara e movimento;
- combinações e refinamento preservando campos não citados;
- pedido vago, ambíguo e preset;
- desfazer/restaurar;
- Libras não autorizada/indisponível;
- compra, reserva, pagamento, CSS/JS e capacidade inexistente;
- prompt injection na mensagem/histórico/conteúdo.

Executar três rodadas por caso e acrescentar paráfrases não usadas no prompt. Meta: ≥ 90% de acerto semântico; escopo e segurança em 100%. Registrar modelo, prompt, parâmetros, tokens, latência e custo vigente. Enquanto não houver provedor configurado: **NOT RUN / provider configuration missing**, não `PASS`.

## 4. Rybená nesta entrega

Podem ser aprovados:

- contrato `LibrasAdapter`;
- isolamento do fornecedor;
- estados `idle`, `loading`, `ready`, `translating`, `paused` e `failed`;
- UI e atribuição;
- carregamento do script somente após ação explícita;
- ausência de polling e retry automático;
- mapeamento determinístico dos métodos documentados;
- erro real de domínio/token não autorizado;
- doubles exclusivos dos testes;
- funcionamento independente do núcleo.

Permanecem bloqueados:

- autorização de domínio/token bem-sucedida;
- envio/retorno real de texto;
- tradução e reprodução;
- abrir/fechar player real;
- pause/resume/stop/velocidade reais;
- eventos e falhas reais do fornecedor;
- avaliação linguística com pessoas surdas sinalizantes.

Marcação obrigatória: **BLOCKED / NOT VALIDATED — provider domain or token not authorized**.

## 5. Acessibilidade e regressão visual

- teclado: Tab, Shift+Tab, Enter/Espaço e Escape;
- leitor de tela: NVDA ou alternativa registrada; se não executado, marcar pendente;
- viewports: 1440×900, 390×844 e 320 px; zoom 200%/reflow equivalente;
- temas padrão/alto contraste; texto 150%; controles/cursor grandes;
- foco visível; painel desktop não modal e mobile modal;
- guia/máscara abaixo de diálogos e sem `pointer-events`;
- console sem erros do host e rede Rybená somente após ação explícita, sem chamadas recorrentes;
- auditoria automática complementa, mas não substitui uso manual.

Não alegar conformidade integral apenas por esses testes.

## 6. Avaliação de imagens — sem implementação

| Candidato | Valor | Risco/decisão |
| --- | --- | --- |
| mapa de assentos | explicar anatomia geral | semântica dos botões/legenda é prioritária; não inferir disponibilidade |
| ícones de comodidades | esclarecer significado | preferir texto adjacente e evitar leitura duplicada |
| logotipo de viação | identificar empresa | decorativo quando o nome já existe |
| campanha de viagem | contexto visual | alt revisado; não inventar cidade/local |
| promoções com texto | preservar condições | exigem equivalente editorial revisado; visão não deduz preço/regra |

## 7. Checklist de entrega

- [x] contratos e schemas runtime fechados;
- [x] preferências v3, migração, persistência e desfazer;
- [x] ferramentas próprias e preset funcionando;
- [x] executor idempotente e concorrência validada;
- [x] planejador real configurado ou limitação explicitada;
- [x] explicação, simplificação e voz validadas nos limites disponíveis;
- [x] adaptador Rybená mapeado e carregamento/recusa real exercitados;
- [x] nenhum VLibras ativo;
- [x] atribuição Rybená visível;
- [x] reflow e ausência de overflow validados em viewport CSS exato de 320×844;
- [ ] teclado completo, zoom 200% e regressão integral da jornada;
- [x] segredo ausente do bundle/logs;
- [x] documentação e evidências refletem o estado real;
- [x] pesquisa humana marcada como realizada ou pendente, nunca presumida.

### Resultado observado em 17/09/2026

| Grupo | Resultado | Evidência |
| --- | --- | --- |
| contratos/store/executor | PASS | 14 testes locais; adaptador Rybená coberto com runtime falso; ação desconhecida e revisão obsoleta rejeitadas; `planId` idempotente |
| TypeScript | PASS | `tsc --noEmit -p tsconfig.app.json --pretty false` |
| build | PASS | Vite 6.4.3, 1.616 módulos |
| painel desktop | PASS | 1440×900; acionador fixo à esquerda permaneceu na posição durante scroll e nas etapas busca, resultados e assentos; drawer não modal, Escape e retorno de foco |
| painel mobile | PASS | 390×844 modal; em 320×844, documento e painel com `scrollWidth=clientWidth=320`; escala de texto a 150% e alto contraste sem overflow horizontal |
| breakpoint 820/821 | PASS | 820 px: diálogo, backdrop, `aria-modal="true"` e `body` bloqueado; 821 px: região não modal, sem backdrop e `body` rolável; sem overflow nos dois casos |
| IA real | NOT RUN | `ACCESSIBILITY_LLM_*` ausentes; 503 seguro observado |
| seleção e explicação local | PASS | arraste real em `search-help` preencheu e focou o campo; “viação” foi respondida pelo glossário revisado; em 390×844 o painel e o bloqueio modal retornaram |
| simplificação local | PASS | versão revisada exibida separadamente e texto original preservado |
| simplificação por LLM | NOT RUN | provedor ausente; caminho remoto permanece protegido pelo 503 seguro |
| voz real | NOT RUN | permissão de microfone não concedida nesta rodada |
| Rybená real | BLOCKED / NOT VALIDATED | CDN carregou; fornecedor exibiu “Token Rybená não autorizado” em `127.0.0.1` |
| ausência de legado | PASS | zero recursos VLibras; Rybená somente após ação explícita |
| leitor de tela/pesquisa humana | NOT RUN | requer NVDA/VoiceOver e participantes adequados |

A nova direção lateral foi inspecionada no navegador integrado em 1440×900, 390×844 e 320×844 CSS px. Em 320 px, as métricas observadas no estado padrão e com texto a 150% foram `clientWidth=320` e `scrollWidth=320` tanto no documento quanto no painel. As capturas da versão anterior foram removidas; `app/scripts/capture-accessibility-evidence.mjs` permanece como caminho reproduzível para gerar novas evidências, que devem ser revisadas antes de serem versionadas.

## 8. Registro

```text
Data / ambiente / versão:
Caso e requisito:
Entrada e pré-condição:
Esperado:
Observado:
PASS / FAIL / NOT RUN / BLOCKED:
Integração real / estrutura / double:
Evidência sanitizada:
Limitação e próxima ação:
```
