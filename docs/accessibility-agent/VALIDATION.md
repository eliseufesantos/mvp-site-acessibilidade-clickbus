# Validação — Acessibilidade Assistida por IA

Versão 2.3 · 18 de setembro de 2026.

## 1. Regra de evidência

Testes automatizados, navegador, integrações reais e avaliação humana são registrados separadamente. Doubles validam contratos e falhas, não inferência ou tradução reais. `PASS` só descreve comportamento efetivamente observado.

Estado Rybená: token temporário vinculado ao domínio autorizado recebido; handler, construção/validação da URL e contrato do adaptador com runtime falso passaram localmente. Fetch no navegador, injeção da tag, download, globals, preparação e player permanecem **NOT RUN**, assim como configuração na Vercel e deploy.

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
| T24 | Rybená sem configuração ou recusada | rota `GET` retorna `503`, método indevido `405`; falha finita, atribuição e núcleo preservados |
| T25 | Jornada completa com preferências | busca/viagem/assento/passageiro preservados |
| T26 | 390×844, 320 px, texto 150% e zoom | sem overflow geral ou controles cortados |
| T27 | Chaves/bundle/logs | nenhuma credencial em Git, bundle estático, logs ou evidências; URL tokenizada não registrada |
| T28 | Fechar painel durante requisição/proposta | preferências mantidas; operação invalidada |
| T29 | Adaptador Gemini com transporte falso | URL/headers/payload nativos; JSON válido; bloqueio/truncamento/malformação falham sem retry |
| T30 | Proteção do endpoint | origem, JSON e 16 KiB exigidos; quota retorna 429 antes de nova chamada paga |
| T31 | Contrato Rybená | handler exige HTTPS no hostname exato, recusa aliases, responde `no-store`/CORP; builder/parser rejeitam token, origem ou parâmetros inválidos; adapter mapeia controles com runtime falso |

T13–T17, T21, T24, T25, T27 e T29–T31 são bloqueadores do núcleo.

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

Executar três rodadas por caso e acrescentar paráfrases não usadas no prompt. Meta: ≥ 90% de acerto semântico; escopo e segurança em 100%. Registrar modelo efetivo, prompt, parâmetros, tokens, latência e custo vigente sem registrar segredo ou conteúdo pessoal. Enquanto não houver segredo no runtime e smoke real: **NOT RUN / runtime provider configuration missing**, não `PASS`.

## 4. Rybená nesta entrega

A aprovação local automática cobre:

- contrato `LibrasAdapter`;
- isolamento do fornecedor;
- estados `idle`, `loading`, `ready`, `translating`, `paused` e `failed`;
- UI e atribuição;
- endpoint `GET /api/accessibility/rybena` desativado sem `RYBENA_ACCESS_TOKEN`, com resposta `no-store`;
- método, HTTPS e hostname exato `mvp-site-acessibilidade-clickbus-lovat.vercel.app`; aliases/previews/outros hosts recusados;
- `Cross-Origin-Resource-Policy: same-origin`, `nosniff`, validação do caminho, formato do token e parâmetros;
- ausência de polling e retry automático;
- mapeamento determinístico dos métodos documentados com runtime falso;
- falha segura quando a configuração está ausente ou o fornecedor recusa a origem;
- doubles exclusivos dos testes;
- funcionamento independente do núcleo.

Permanecem `NOT RUN` ou não validados:

- configuração de `RYBENA_ACCESS_TOKEN` no projeto/ambiente Vercel que atende o domínio autorizado;
- deploy e smoke no domínio autorizado;
- fetch da configuração no navegador, injeção da tag, download do CDN e presença dos globals;
- preparação do player e timeouts reais de 10 s/15 s;
- envio/retorno real de texto;
- tradução e reprodução;
- abrir/fechar player real;
- pause/resume/stop/velocidade reais;
- eventos e falhas reais do fornecedor;
- avaliação linguística com pessoas surdas sinalizantes.

Marcação obrigatória até o smoke: **NOT RUN — Vercel configuration, deployment and authorized-domain smoke pending**. Mesmo após funcionamento técnico, qualidade linguística permanece não homologada até avaliação com pessoas surdas sinalizantes.

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
- [x] credenciais ausentes do repositório, bundle estático e logs no baseline inspecionado;
- [x] documentação e evidências refletem o estado real;
- [x] pesquisa humana marcada como realizada ou pendente, nunca presumida.

### Resultado observado em 18/09/2026

| Grupo | Resultado | Evidência |
| --- | --- | --- |
| contratos/store/executor | PASS | 24 testes locais; adaptadores Gemini/Rybená, handler e URL cobertos com transporte/runtime falso; ação desconhecida e revisão obsoleta rejeitadas; `planId` idempotente |
| TypeScript | PASS | `pnpm --dir app typecheck` |
| build | PASS | Vite 6.4.3, 1.616 módulos |
| funções Vercel | PASS local | quatro wrappers da raiz compilados por `tsc`, incluindo `GET /api/accessibility/rybena`; deployment/smoke remoto ainda `NOT RUN` |
| API local sem segredo | PASS | `vite preview`: SPA `200`; planejador same-origin `503` e origem indevida `403`; rota Rybená sem token `GET 503` e método indevido `405` |
| painel desktop | PASS | 1440×900; acionador fixo à esquerda permaneceu na posição durante scroll e nas etapas busca, resultados e assentos; drawer não modal, Escape e retorno de foco |
| painel mobile | PASS | 390×844 modal; em 320×844, documento e painel com `scrollWidth=clientWidth=320`; escala de texto a 150% e alto contraste sem overflow horizontal |
| breakpoint 820/821 | PASS | 820 px: diálogo, backdrop, `aria-modal="true"` e `body` bloqueado; 821 px: região não modal, sem backdrop e `body` rolável; sem overflow nos dois casos |
| adaptador Gemini | PASS | URL nativa, chave somente em header, JSON estruturado, `STOP`, bloqueio, truncamento e JSON inválido cobertos sem rede/segredo |
| proteções do endpoint | PASS local | origem, content type, corpo de 16 KiB e quota em memória cobertos; quota externa/persistente ainda não configurada |
| IA real | NOT RUN | `ACCESSIBILITY_LLM_*` ausentes no runtime; nenhum segredo foi gravado; 503 seguro observado |
| seleção e explicação local | PASS | arraste real em `search-help` preencheu e focou o campo; “viação” foi respondida pelo glossário revisado; em 390×844 o painel e o bloqueio modal retornaram |
| simplificação local | PASS | versão revisada exibida separadamente e texto original preservado |
| simplificação por LLM | NOT RUN | adaptador existe, mas conectividade/qualidade do modelo real não foram exercitadas |
| voz real | NOT RUN | permissão de microfone não concedida nesta rodada |
| handler/URL/contrato Rybená | PASS local | `503`/`405`/`403`/`200`, host HTTPS exato, CORP, construção/parser da URL e controles com runtime falso; sem credencial real |
| caminho navegador/CDN/player Rybená | NOT RUN | fetch, injeção DOM, download, globals, preparação e player não foram exercitados; `RYBENA_ACCESS_TOKEN` ainda não configurada na Vercel e deploy/smoke não executados |
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
