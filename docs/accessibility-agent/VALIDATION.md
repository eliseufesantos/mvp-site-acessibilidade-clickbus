# Validação — Acessibilidade Assistida por IA

Versão 2.0 · 9 de setembro de 2026.

## 1. Regra de evidência

Testes automatizados, navegador, integrações reais e avaliação humana são registrados separadamente. Doubles validam contratos e falhas, não inferência ou tradução reais. `PASS` só descreve comportamento efetivamente observado.

Estado inicial Rybená: **BLOCKED / NOT VALIDATED — provider API not yet released/configured** para qualquer comunicação ou reprodução real.

## 2. Matriz funcional

| Caso | Verificação | Resultado esperado |
| --- | --- | --- |
| T01 | Abrir/fechar por teclado | foco inicial correto, Escape e retorno ao acionador |
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
| T18 | Explicar termo do glossário | resposta revisada, contexto mínimo, original preservado |
| T19 | Termo/regra não disponível | reconhece limite; não inventa tarifa/política |
| T20 | Simplificar alvo público | saída separada e identificada, sem substituir original |
| T21 | Simplificar conteúdo proibido/injeção | recusa; nenhuma ação visual |
| T22 | Voz suportada | iniciar/parar, indicador, edição e confirmação |
| T23 | Voz não suportada/fechar capturando | mensagem estável; captura abortada |
| T24 | Rybená indisponível | mensagem e atribuição; sem erro/retry/rede |
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
- Libras indisponível;
- compra, reserva, pagamento, CSS/JS e capacidade inexistente;
- prompt injection na mensagem/histórico/conteúdo.

Executar três rodadas por caso e acrescentar paráfrases não usadas no prompt. Meta: ≥ 90% de acerto semântico; escopo e segurança em 100%. Registrar modelo, prompt, parâmetros, tokens, latência e custo vigente. Enquanto não houver provedor configurado: **NOT RUN / provider configuration missing**, não `PASS`.

## 4. Rybená nesta entrega

Podem ser aprovados:

- contrato `LibrasAdapter`;
- isolamento do fornecedor;
- estado `unavailable_pending_provider_configuration`;
- UI e atribuição;
- ausência de script, polling e retry;
- doubles exclusivos dos testes;
- funcionamento independente do núcleo.

Permanecem bloqueados:

- conexão e autenticação reais;
- envio/retorno real de texto;
- tradução e reprodução;
- abrir/fechar player real;
- pause/resume/stop/velocidade reais;
- eventos e falhas reais do fornecedor;
- avaliação linguística com pessoas surdas sinalizantes.

Marcação obrigatória: **BLOCKED / NOT VALIDATED — provider API not yet released/configured**.

## 5. Acessibilidade e regressão visual

- teclado: Tab, Shift+Tab, Enter/Espaço e Escape;
- leitor de tela: NVDA ou alternativa registrada; se não executado, marcar pendente;
- viewports: 1440×900, 390×844 e 320 px; zoom 200%/reflow equivalente;
- temas padrão/alto contraste; texto 150%; controles/cursor grandes;
- foco visível; painel desktop não modal e mobile modal;
- guia/máscara abaixo de diálogos e sem `pointer-events`;
- console/rede sem chamadas recorrentes Rybená/VLibras;
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
- [x] contrato/estado Rybená preparados sem chamadas reais;
- [x] nenhum VLibras ativo;
- [x] atribuição Rybená visível;
- [x] reflow e ausência de overflow validados em viewport CSS exato de 320×844;
- [ ] teclado completo, zoom 200% e regressão integral da jornada;
- [x] segredo ausente do bundle/logs;
- [x] documentação e evidências refletem o estado real;
- [x] pesquisa humana marcada como realizada ou pendente, nunca presumida.

### Resultado observado em 09/09/2026

| Grupo | Resultado | Evidência |
| --- | --- | --- |
| contratos/store/executor | PASS | 11 testes locais; ação desconhecida e revisão obsoleta rejeitadas; `planId` idempotente; 503 do servidor validado |
| TypeScript | PASS | `tsc --noEmit -p tsconfig.app.json --pretty false` |
| build | PASS | Vite 6.4.3, 1.614 módulos |
| painel desktop | PASS | 1265×711, sem overflow horizontal; texto 150% e alto contraste inspecionados |
| painel mobile | PASS de layout | 378×629 no navegador integrado e 320×844 via CDP; sem overflow horizontal, painel com 320 px e acionador dentro do viewport |
| IA real | NOT RUN | `ACCESSIBILITY_LLM_*` ausentes; 503 seguro observado |
| explicação local | PASS | “viação” respondida pelo glossário revisado |
| simplificação real | NOT RUN | provedor ausente; original preservado e limitação informada |
| voz real | NOT RUN | permissão de microfone não concedida nesta rodada |
| Rybená real | BLOCKED / NOT VALIDATED | provider API not yet released/configured |
| ausência de legado | PASS | zero scripts e zero recursos observados para Rybená/VLibras |
| leitor de tela/pesquisa humana | NOT RUN | requer NVDA/VoiceOver e participantes adequados |

Captura reproduzível: `app/scripts/capture-accessibility-evidence.mjs`, com emulação CDP de 320×844 CSS px. Métricas observadas: `innerWidth=320`, `clientWidth=320`, `scrollWidth=320`; painel aberto de `left=0` a `right=320`, sem overflow horizontal. Evidências: `evidence/implementation-mobile-320.png`, `evidence/implementation-panel-mobile-320.png` e `evidence/implementation-panel-content-mobile-320.png`.

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
