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

- contrato `RybenaAdapter`;
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

### Resultado observado em 19/09/2026 — Fase 2 e T0.3

Rodada do redesenho do painel para o padrão lançador + superfície, do adaptador
de desenvolvimento de Libras/voz e da regressão integral. Build de produção
servida em `127.0.0.1:4175`; onde indicado, servidor de desenvolvimento em
`:4173` com `VITE_A11Y_LIBRAS_SIMULATION=on`.

| Caso | Status | Evidência |
|---|---|---|
| typecheck do app, build, suíte, typecheck de `api/` | PASS | suíte de 27 para 35 testes |
| jornada busca → confirmação | PASS | 5 etapas; `scrollY = 0` e foco em `main#main-content` a cada troca; 0 erro e 0 exceção no console |
| axe-core 4.10.2 em 5 telas | PASS | 0 violações, tags wcag2a/2aa/21a/21aa/22aa |
| axe com o painel aberto em 1440, 821, 820, 390 e 320 px | PASS | 0 violações |
| queda de `passes` de 304 para 295 | PASS, explicado | apenas `aria-required-children` e `aria-required-parent`, que ficaram **inaplicáveis** com a saída do `tablist`; nenhuma regra passou de aprovada a violada; comparação por identificador de regra contra linha de base recapturada no `HEAD` `91b8f7d` |
| reflow 1440×900, 390×844, 320×844 | PASS | 0 px de overflow, painel aberto e fechado |
| reflow extremo 320 px + texto 150% + alto contraste + painel | PASS | 0 px de overflow |
| breakpoint 820 px | PASS | `role="dialog"`, `aria-modal="true"`, backdrop, `body.overflow = hidden` |
| breakpoint 821 px | PASS | `role="region"`, sem `aria-modal`, sem backdrop, body rolável |
| Escape fecha e devolve foco ao acionador | PASS | desktop e mobile |
| armadilha de foco só no modal | PASS | 30 `Tab` escapam em 1440 px; nenhum escapa em 390 px |
| foco com aba oculta e `requestAnimationFrame` desligado | PASS | abre no primeiro cartão e devolve o foco ao acionador |
| teclado da grade a cada superfície e de volta | PASS | 5 superfícies; "Voltar" é o primeiro focável; o foco retorna ao cartão de origem |
| chat visível em todas as superfícies | PASS | inclusive em 320 px, colapsado em uma linha |
| estados do chat: enviando, 503, 429, 502 ocupado, 502 genérico, fora do contrato | PASS | seis mensagens em português, `role="status"` com `aria-atomic="true"`; nenhuma finge sucesso |
| roteamento visual pelo plano | PASS dev | `set_preferences` aplicado, desfazer oferecido |
| `propose` não aplica sem confirmação | PASS dev | proposta renderizada, nada aplicado até a confirmação explícita |
| roteamento Libras pelo plano | PASS dev, **simulado** | `translate_content` levou o player simulado a `translating` em modo Libras |
| roteamento voz pelo plano | PASS dev, **simulado** | `speak_content` levou o player simulado a `translating` em modo voz |
| indisponibilidade comunicada com honestidade | PASS | build de produção sem token: "A Rybená ainda não foi configurada neste ambiente.", em tom de erro, sem desfazer e sem fingir execução |
| exclusões de checkout e passageiro | PASS | no checkout o pedido ao planejador levou `contentTargets: []`, sem `translate_content` nem `speak_content` nas capacidades, e o corpo não continha nome, CPF nem data de nascimento |
| executor não toca nos métodos visuais da Rybená | PASS | teste com runtime falso contendo os 16 métodos visuais documentados; após seis planos, a lista de métodos tocados é vazia |
| contrato 2.1 e rejeição do 2.0 | PASS | `POST /plan` com `2.1` responde `503` honesto; com `2.0` responde `400`; o executor também rejeita |
| endpoints 405, 403, 415, 413, 503 | PASS | todos `application/json` |
| adaptador de desenvolvimento ausente do bundle | PASS | busca literal em `app/dist/assets/index-*.js`: `RybenaDevelopment` e as mensagens do double ausentes; só o rótulo do aviso permanece, e ele nunca é renderizado em produção |
| aviso permanente de simulação | PASS | visível em todas as superfícies com a flag ligada; o double não reivindica o crédito de tradução real |
| guia e máscara não interceptam ponteiro | PASS | `pointer-events: none` nas quatro camadas; `elementFromPoint` devolve o botão |
| anúncio de filtragem | PASS | um anúncio atômico: "2 opções encontradas para 26 de setembro." |
| versão do contrato citada no prompt do planejador | PASS após correção | o prompt dizia "contrato 2.0" com `CONTRACT_VERSION = 2.1`; passou a ser interpolada da constante, com teste que falha se divergir — eficácia conferida invertendo o prompt |
| trocar de modo só ao iniciar, nunca ao visualizar | PASS após correção | `PlayerSurface` trocava o modo na montagem; reproduzido com Libras em andamento, abrir o cartão Voz habilitava o transporte de voz e furava o guard de modo do executor. Corrigido e verificado nos três momentos |
| pictograma do acionador visível de 320 a 1440 px | PASS após correção | duas regras de `components.css` do acionador antigo do `Header` escondiam o ícone abaixo de 360 px; removidas. Verificado em 1440, 821, 820, 480, 390, 360 e 320 px |
| captura de evidência em 320 px | PASS | três PNG regenerados e revisados em `docs/accessibility-agent/evidence/`, **não versionados** |
| tradução real em Libras | BLOCKED | token preso ao domínio autorizado; localhost é recusado pelo fornecedor |
| narração real em voz | BLOCKED | mesmo motivo; `switchToVoz()` está integrado e coberto por runtime falso, nunca exercitado de verdade |
| `mode=api` com o token real | NOT RUN | depende do deploy no domínio autorizado |
| IA real nesta rodada | NOT RUN | sem credencial local; endpoint responde `503` honesto |
| qualidade semântica da explicação por IA | NOT RUN | prompt revisto em T1.8; avaliação humana continua pendente |
| `429` do nosso rate limit no navegador | NOT RUN ao vivo | coberto por teste e pelo estado renderizado com resposta controlada |
| NVDA, VoiceOver e pessoas usuárias | NOT RUN | |
| pessoas surdas sinalizantes | NOT RUN | |
| Safari e iOS reais, zoom de 200% | NOT RUN | |

**Desvio consciente registrado (T1.7, item 3).** `autocomplete="off"` em nome,
CPF e data de nascimento conflita com o SC 1.3.5, mas é defensável num protótipo
que proíbe dados reais e pede confirmação explícita de dados fictícios.

**Limite que permanece.** Zero violações no axe significa ausência de defeito
automatizável, não acessibilidade comprovada: a ferramenta cobre cerca de um
terço dos critérios WCAG. O adaptador de desenvolvimento é ferramenta de
desenvolvimento e não prova nada sobre a Rybená.

### Resultado observado em 19/09/2026 — acionador no header e preferências v4

Segunda rodada do mesmo dia, depois da revisão do padrão visual com o
responsável. Build de produção em `127.0.0.1:4175`.

| Caso | Status | Evidência |
|---|---|---|
| acionador no `Header`, à direita, com pictograma universal | PASS | visível de 320 a 1440 px; `Header` é sticky, então segue alcançável na rolagem |
| raiz em grade 2×2 com "Sobre" como link | PASS | 4 cartões + link; descrição de cada cartão em `aria-describedby` |
| chips de sugestão preenchem sem enviar | PASS | após o clique, campo preenchido e região de estado vazia, sem chamada ao planejador |
| chat aplica plano com preferência da v4 | PASS | `saturation=low` e `dyslexiaFont=true` chegam ao DOM, camada de filtro aparece e desfazer é oferecido |
| retorno de foco ao sair de cada superfície | PASS após correção | sair de "Sobre" caía no `body`; o link recebeu `id="a11y-card-about"` e as 5 entradas voltaram a devolver o foco à origem |
| axe em 5 telas e no painel em 5 larguras | PASS | 0 violações |
| reflow 1440/390/320, painel aberto e fechado | PASS | 0 px de overflow |
| breakpoints 820/821 | PASS | diálogo modal com backdrop vs. região não modal |
| Escape, armadilha de foco, aba oculta sem `rAF` | PASS | o acionador no header recebe o foco de volta |
| camada de saturação/correção não quebra `position: fixed` | PASS | 6 estados, incluindo combinações; painel ancorado e botão da busca clicável |
| camada de filtro não intercepta ponteiro | PASS | `pointer-events: none`; `elementFromPoint` devolve o botão |
| guia e máscara com preferências vindas de v3 migrado e de v4 | PASS | 4 camadas com `pointer-events: none` nos dois caminhos |
| migração v3 → v4 sem perder o que estava salvo | PASS | teste confere as 13 chaves antigas uma a uma e o padrão das 3 novas |
| servidor recusa preferências incompletas | PASS | 16 chaves → `503` honesto; sem as 3 novas → `400` |
| jornada completa | PASS | 0 erro e 0 exceção de console |
| captura de evidência em 320 px | PASS | 3 PNG regenerados e revisados |
| correção de cores validada com pessoas com dicromacia | NOT RUN | as matrizes são aproximação, não simulação clínica |
| fonte para dislexia validada com pessoas disléxicas | NOT RUN | usa famílias já instaladas no sistema; o ganho presumido vem de espaçamento e peso |

**Decisão registrada.** Os ajustes visuais continuam sendo responsabilidade
exclusiva do executor local. A alternativa de delegá-los aos toggles da Rybená
foi avaliada e recusada: os métodos do fornecedor são relativos, não
declarativos, o que quebraria idempotência, desfazer e funcionamento offline —
ver a seção 7.7 do plano. Três recursos que só a Rybená tinha foram portados
localmente.

### Resultado observado em 19/09/2026 — terceira rodada

| Caso | Status | Evidência |
|---|---|---|
| correção de cores aumenta a separação em vez de simular a deficiência | **FAIL corrigido** | as matrizes originais eram de simulação: vermelho–verde caía de 1,414 para 0,559 na deuteranopia. Substituídas por daltonização escolhida por medição; teste novo reprova qualquer matriz que baixe a média ou piore o pior par, e a eficácia foi verificada reintroduzindo as antigas |
| contador de ajustes estilizado após o portal | **FAIL corrigido** | o seletor ancorado em `.accessibility-plugin` deixou de casar, e o contador virou uma segunda linha dentro do círculo. Escopado em `.accessibility-plugin__trigger-badge`; medido `position: absolute`, 22×22 |
| ícone do acionador | PASS | pictograma universal de acesso próprio, no lugar do ícone de cadeira de rodas do Lucide |
| Libras e Voz abrem a Rybená sem superfície intermediária | PASS | sem token: mensagem honesta e permanece na raiz; com o adaptador simulado: "Pronto. Selecione um texto na página…" |
| URL do CDN em `mode=full` com `disableAccessibilityButton=true` | PASS de contrato | validadores do servidor e do navegador e teste de formato atualizados. **Funcionamento real: NOT RUN** — depende do domínio autorizado |
| chat maior com histórico visível | PASS | últimos quatro turnos, com quem falou |
| superfície Conteúdo simplificada | PASS | um fluxo em vez de duas seções paralelas; seletor só com mais de um trecho; um resultado por vez |
| indicador de ajustes ativos | PASS | "N ajustes ativos nesta página" com nomes e "Remover todos", sem o número interno de revisão |
| axe, reflow, breakpoints, foco, teclado, jornada, endpoints | PASS | 0 violações, 0 px de overflow, 39 testes |
| `mode=full` com o token real | NOT RUN | não verificável fora do domínio autorizado; se falhar, Libras e voz não abrem |
| correção de cores com pessoas com dicromacia | NOT RUN | as matrizes são aproximação medida, não validação com pessoas |

**Exposição de dados registrada.** Com a seleção dentro da barra da Rybená,
qualquer texto da página pode chegar ao fornecedor, inclusive nome e CPF no
checkout. O responsável optou por manter Libras e Voz em todas as etapas. A
exclusão de dados de checkout continua valendo para o planejador de IA e para
as ferramentas de conteúdo, e não alcança essa seleção livre.

### Resultado observado em 19/09/2026 — chat unificado, contrato 2.2

| Caso | Status | Evidência |
|---|---|---|
| um chat atende ajuste e dicionário | PASS | quatro casos medidos no navegador com planejador substituído e executor real |
| termo do glossário responde sem rede | PASS | só `/plan` na aba de rede; origem "Conteúdo revisado deste protótipo" |
| termo desconhecido cai em `/explain` com origem declarada | PASS | `/plan` e `/explain`; origem "Gerado por IA — confira antes de usar" |
| simplificação usa a versão revisada local | PASS | só `/plan` |
| roteamento vem do plano, não de heurística de string | PASS | ações `explain_term` e `simplify_content` no contrato 2.2 |
| capacidade ausente recusada antes de efeito | PASS | teste |
| ação de conteúdo não toca no player nem em preferências | PASS | teste |
| seleção na página restrita a alvos públicos | PASS | hook `usePageSelection`, mesma restrição da superfície anterior |
| axe, reflow, breakpoints, foco, teclado, jornada, endpoints | PASS | 0 violações, 0 px, 40 testes |
| qualidade semântica da explicação por IA | NOT RUN | T1.8 segue aberta; por isso o glossário vem primeiro e a origem é declarada |

### Resultado observado em 19/09/2026 — seleção, persistência e chat

| Caso | Status | Evidência |
|---|---|---|
| painel permanece aberto durante a seleção no desktop | **FAIL corrigido** | fechava por herança da gaveta lateral; agora só se recolhe no mobile |
| `aria-hidden` só quando o painel está oculto | PASS | ausente no desktop, `true` no mobile; axe segue sem `aria-hidden-focus` |
| painel sobrevive à troca de etapa | **FAIL corrigido** | `search → results` com o painel no DOM e visível; proposta pendente é recolhida |
| foco volta ao campo do chat após a seleção | **FAIL corrigido** | apontava para `term-to-explain`, removido com o `ContentTools`; o foco caía no `body` sem erro |
| termo selecionado chega ao campo | PASS | `o que significa "…"?`, pronto para revisão antes do envio |
| chat como ação principal | PASS | cartão elevado, título, campo maior e botão de envio rotulado |
| axe, reflow, breakpoints, foco, teclado, jornada | PASS | 0 violações, 0 px, 40 testes, 0 erro de console |

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
