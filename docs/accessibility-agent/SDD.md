# SDD — Acessibilidade Assistida por IA

Versão 2.3 · 18 de setembro de 2026 · Documento normativo de engenharia.

## 1. Estado inspecionado

A aplicação usa React 18, TypeScript e Vite. A réplica possui a jornada `search → results → seats → checkout → confirmation`, tokens, preferências v3 e componentes reaproveitáveis.

Classificação da auditoria Rybená:

- integração demonstrativa: adaptador real carregado sob demanda a partir do CDN público;
- configuração local: handler, construção/validação da URL e contrato do adaptador com runtime falso validados por typecheck, build e suíte de 24 testes; fetch no navegador, injeção DOM e player não foram exercitados;
- métodos confirmados: `openPlayer`, `closePlayer`, `switchToLibras`, `translate`, `pause`, `play`, `stop`, `setSpeed`, `handleLoaded` e `handleTranslate`;
- mock/double: nenhum em produção;
- acesso técnico: token temporário vinculado ao domínio autorizado recebido fora do repositório; configuração de `RYBENA_ACCESS_TOKEN` na Vercel ainda `NOT RUN`;
- teste histórico: `127.0.0.1` foi recusado pelo fornecedor e pode continuar não autorizado por não ser o domínio vinculado ao token;
- limites atuais: URL `master/latest` não versionada, credencial temporária, deploy/smoke real pendentes e tradução não homologada;
- legado VLibras: removido da árvore atual; existia no `HEAD` e incluía helper não documentado.

Nenhum VLibras é carregado. O script Rybená só entra após clique explícito em “Traduzir trecho em Libras”; nesse momento o loader consulta `GET /api/accessibility/rybena`, sem polling ou retry automático.

## 2. Arquitetura

```text
Plugin lateral fixo (fora do Header)
  ├─ controles manuais ───────────────┐
  ├─ cliente do planejador → /api → LLM configurada
  ├─ glossário/simplificação revisada → local
  ├─ explicação/simplificação → /api somente quando necessário
  └─ voz → transcrição editável       │
                                      ↓
                            executor determinístico
                                      ├─ store v3 → adaptador ClickBus → tokens
                                      └─ LibrasPort → GET /api/accessibility/rybena
                                                        ↓
                                              RybenaBrowserAdapter sob demanda
```

O núcleo não importa dados comerciais nem executa navegação. Contratos de planejamento, explicação e simplificação são distintos. Falhas de IA e Rybená são independentes.

Organização implementável:

```text
app/src/features/accessibility-agent/
  core/contracts.ts
  core/preferences.ts
  core/executor.ts
  core/glossary.ts
  core/plannerClient.ts
  adapters/clickbus/content.ts
  adapters/libras/contracts.ts
  adapters/libras/rybenaBrowser.ts
  adapters/libras/rybenaUnavailable.ts
  ui/AccessibilityPanel.tsx
  ui/ContentTools.tsx
app/src/components/accessibility/AccessibilityPlugin.tsx
app/src/styles/accessibility-plugin.css
app/server/accessibility/handler.ts
app/server/accessibility/provider.ts
app/server/accessibility/prompt.ts
app/server/accessibility/rybena.ts
api/accessibility/{plan,explain,simplify,rybena}.ts
```

## 3. Estado canônico

```ts
type VisualPreferences = {
  contrast: 'default' | 'high';
  textScale: 1 | 1.125 | 1.25 | 1.5;
  controlSize: 'default' | 'large';
  cursor: 'default' | 'large';
  highlightLinks: boolean;
  highlightHeadings: boolean;
  letterSpacing: 'default' | 'wide';
  lineHeight: 'default' | 'comfortable' | 'wide';
  textAlign: 'original' | 'left' | 'center';
  readingGuide: boolean;
  readingMask: boolean;
  reducedMotion: boolean;
};

type StoredPreferencesV3 = {
  version: 3;
  visual: VisualPreferences;
  libras: { speed: 0.5 | 0.75 | 1 | 1.25 | 1.5 };
};
```

Chave: `clickbus-a11y-v3`. Defaults: valores `default`/`original`, booleanos desligados e movimento inicial compatível com `prefers-reduced-motion`. Preferência explícita persistida prevalece.

Migrações:

- v1: `highContrast`, `elderlyMode`, `reducedMotion`, `librasWidget`;
- v2 plana atual: `highContrast`, `textScale`, `comfortableSpacing`, `largeControls`, `readingGuide`, `reducedMotion`, `librasSpeed`.

`elderlyMode` e `comfortableSpacing` viram patch explícito de leitura; `librasWidget/librasEnabled` não ativa nem carrega fornecedor. Leitura e escrita de storage usam validação runtime e `try/catch`. Estado inválido usa defaults; falha de escrita mantém operação em memória e expõe aviso discreto.

Estado efêmero:

- `stateRevision`: incrementa após transação visual efetiva;
- `pageEpoch`: incrementa quando a página/alvos mudam;
- `panelSession`: incrementa ao abrir e fechar;
- snapshot de um nível para desfazer;
- proposta, requisição, transcrição e recibos somente em memória.
- painel aberto, sessão e modo explícito de seleção somente em memória.

## 4. Aplicação visual

| Campo | Efeito |
| --- | --- |
| `contrast` | tokens semânticos; nunca filtro/inversão global |
| `textScale` | tamanho raiz/tokens com reflow; nunca `transform: scale()` |
| `controlSize` | controles principais com mínimo de 48/56 CSS px |
| `cursor` | cursores ampliados locais com fallback seguro |
| `highlightLinks` | sublinhado/realce que não dependa só de cor |
| `highlightHeadings` | borda/marcador de títulos sem mudar hierarquia |
| `letterSpacing` | tracking discreto em conteúdo, independente da entrelinha |
| `lineHeight` | três valores discretos, sem alterar tracking |
| `textAlign` | original/esquerda/centro em conteúdo aplicável; controles preservam alinhamento próprio |
| `readingGuide` | faixa `pointer-events:none`, abaixo do foco/modais |
| `readingMask` | cortinas acima/abaixo da linha, `pointer-events:none`, com abertura suficiente |
| `reducedMotion` | remove movimento não essencial e rolagem suave |

O preset `comfortable_reading` aplica `{textScale:1.125, letterSpacing:'wide', lineHeight:'comfortable', textAlign:'left', reducedMotion:true}` e preserva o restante.

## 5. Contratos runtime

Contrato de planejamento `2.0`:

```ts
type PlanMode = 'apply' | 'propose' | 'clarify' | 'unsupported';
type Action =
  | { type: 'set_preferences'; patch: Partial<VisualPreferences> }
  | { type: 'apply_comfortable_reading' }
  | { type: 'undo_preferences' }
  | { type: 'reset_preferences' }
  | { type: LibrasAction; contentRef?: string; speed?: LibrasSpeed };
```

Entrada: mensagem ≤ 1.000 caracteres, histórico ≤ 6 itens, corpo ≤ 16 KiB, preferências, revisões, capacidades e metadados de alvos. Rejeitar chaves desconhecidas em entrada, plano, ações e patches. No máximo três ações; undo/reset são exclusivos; validar o lote inteiro antes do primeiro efeito.

O servidor gera `planId` e ecoa revisões validadas. O executor revalida `stateRevision`, `pageEpoch`, `panelSession` e capacidades; mantém recibos por `planId` para idempotência. Resultado de cada ação: `applied`, `no_change`, `failed` ou `skipped`. Confirmação visível deriva desses recibos.

Pedidos vagos produzem `propose`; confirmação expira em 120 s ou quando qualquer revisão muda. Pedidos explícitos reversíveis usam `apply`. Conteúdo comercial, código, HTML, CSS, seletor ou ação desconhecida produz `unsupported`/rejeição e nenhuma mutação.

Termos do glossário são explicados localmente. Explicação fora do glossário usa `POST /api/accessibility/explain` com `{term, context, contentRef}`. Cada alvo inicial com `simplifiedText` é simplificado localmente; somente um alvo permitido sem versão revisada pode usar `POST /api/accessibility/simplify` com `{text, contentRef}`. Esses endpoints não retornam ações e seus clientes nunca passam respostas ao executor. Sem provedor configurado, os caminhos remotos retornam `503` finito.

## 6. Adaptador do hospedeiro

```ts
interface AccessibilityHostAdapter {
  getPageEpoch(): number;
  getContentTargets(): readonly ContentTarget[];
  resolveContent(id: string): string | null;
  getCapabilities(): readonly ActionType[];
}
```

O adaptador ClickBus mantém registro fechado de conteúdo público revisado: `search-help`, `results-help`, `service-class-help` e `seat-map-help`, conforme a página atual. Não lê `document.body.innerText` nem consulta seletores livres. Inputs, checkout, passageiro, bilhete, preço, pagamento e conteúdo oculto são excluídos.

Seleção do mouse/toque só é aceita no modo explícito, entre 2 e 120 caracteres e quando início e fim estão no mesmo alvo registrado. O adaptador mantém em memória a última seleção aprovada da página durante a transição de eventos, sem persistência. O campo editável de termo e o seletor nativo de alvos públicos são os caminhos alternativos por teclado. Texto máximo para simplificação: 1.500 caracteres, sem truncamento silencioso. Conteúdo é dado, nunca instrução.

## 7. Libras e Rybená

Contrato estável. Libras e voz **não** são dois serviços: são dois modos do
mesmo player da Rybená, que compartilham `translate`, `play`, `pause`, `stop` e
`setSpeed`. Por isso existe um único port com `setMode`. Um port separado para
voz duplicaria o ciclo de vida e criaria dois players disputando o mesmo
runtime.

```ts
type RybenaMode = 'libras' | 'voz';

type RybenaState =
  | 'idle' | 'unavailable_pending_provider_configuration'
  | 'loading' | 'ready' | 'translating' | 'paused' | 'failed';

interface RybenaSnapshot {
  state: RybenaState;
  mode: RybenaMode;
  message: string;
  attribution: string;
  attributionUrl: string;
  simulated: boolean;
}

interface RybenaAdapter {
  getSnapshot(): RybenaSnapshot;
  initialize(): Promise<RybenaReceipt>;
  setMode(mode: RybenaMode): Promise<RybenaReceipt>;
  open(): Promise<RybenaReceipt>;
  close(): Promise<RybenaReceipt>;
  translate(content: PublicContent): Promise<RybenaReceipt>;
  pause(): Promise<RybenaReceipt>;
  resume(): Promise<RybenaReceipt>;
  stop(): Promise<RybenaReceipt>;
  setSpeed(speed: LibrasSpeed): Promise<RybenaReceipt>;
  subscribe(listener: () => void): () => void;
}
```

O port **não declara nenhum método visual da Rybená** — `toggleZoom`,
`toggleDarkContrast`, `toggleReadingMask` e semelhantes. Os ajustes visuais são
responsabilidade exclusiva do executor local; se os dois aplicarem, os efeitos
somam e quebram. Não acrescente esses métodos aqui.

**Quem pode trocar o modo.** O modo muda quando a pessoa inicia ou abre aquele
modo, nunca ao apenas visualizar a superfície correspondente. Trocar o modo na
montagem de uma superfície comutaria um player em andamento e, pior, furaria o
guard do executor, que decide a legitimidade de uma ação de transporte olhando
`getSnapshot().mode`. No executor, as ações de entrada (`open_*`,
`translate_content`, `speak_content`) trocam o modo antes de agir; as de
transporte (`pause_*`, `resume_*`, `stop_*`) só agem quando o player já está no
modo pedido, e recusam com mensagem honesta caso contrário. Fechar vale para os
dois modos.

Em produção, `RybenaBrowserAdapter` solicita a configuração same-origin somente após ação explícita. `GET /api/accessibility/rybena` lê `RYBENA_ACCESS_TOKEN` apenas no servidor, valida seu formato e responde `no-store`, `Cross-Origin-Resource-Policy: same-origin` e `nosniff` com uma URL do host e caminho fixos da Rybená, contendo `token`, `mode=api` e `doNotTrack=true`; sem configuração válida, retorna `503` finito. Com credencial, o handler aceita somente HTTPS no hostname exato `mvp-site-acessibilidade-clickbus-lovat.vercel.app`; HTTP, localhost e aliases/previews/outros hostnames retornam `403`.

O cliente revalida origem, caminho e parâmetros antes de injetar uma tag no `<head>`, também com atributo `doNotTrack="true"` e política de referência restrita. O fetch da configuração é abortado após 10 s. Download do script, `getRybenaScripts('hidden')` e espera de `handleLoaded` têm limite independente de 15 s. Erro/timeout remove a tag; se ela carregar sem disponibilizar `RybenaDOM` ou `RybenaApi`, também é removida para permitir nova tentativa manual. Não há retry automático.

O token não pode ser versionado, embutido no bundle estático, persistido ou incluído em logs/evidências. Como o protocolo do fornecedor exige a URL tokenizada no navegador, ela fica observável na rede somente depois da ação da pessoa usuária; a proteção operacional depende do vínculo ao domínio e da validade curta. `RybenaUnavailableAdapter` permanece como fallback determinístico e apoio a testes.

O token temporário aplicável já foi recebido. Antes de declarar tradução real, ainda é necessário configurar `RYBENA_ACCESS_TOKEN` no projeto/ambiente Vercel que atende o domínio autorizado, executar deploy e smoke controlado e registrar os resultados sem expor a URL completa. Localhost pode continuar recusado. A qualidade linguística permanece pendente de homologação com pessoas surdas sinalizantes.

Existem três implementações do port. `RybenaBrowserAdapter` é a de produção.
`RybenaUnavailableAdapter` permanece como fallback determinístico e apoio a
testes. `RybenaDevelopmentAdapter` é um double de **desenvolvimento**, e não
apenas de teste: ele percorre a máquina de estados sem rede para que Libras e
voz possam ser exercitadas fora do domínio autorizado, onde o fornecedor recusa
a origem.

A escolha entre elas fica em `adapters/libras/selection.ts` e é tratada como
código de segurança, porque um double vazado para produção viraria alegação
falsa de tradução em Libras. São duas barreiras independentes:

1. `import.meta.env.DEV` aparece **literalmente** no ternário da seleção. O
   empacotador o substitui por `false` na build de produção, dobra o `&&` e
   remove a referência à classe, que deixa de existir no bundle. Extrair essa
   checagem para dentro da função pura quebraria a dobra estática;
2. `shouldSimulateLibras` — pura e coberta por teste — exige, além de
   desenvolvimento, o valor exato da variável de ativação
   `VITE_A11Y_LIBRAS_SIMULATION`. A flag não é segredo e nunca carrega
   credencial.

Enquanto `RybenaSnapshot.simulated` for verdadeiro, a interface é obrigada a
exibir aviso permanente de simulação, e o double nunca reivindica o crédito de
tradução real. Ao mexer nessa área, refaça a busca literal por
`RybenaDevelopment` em `app/dist/assets/index-*.js` depois de um build limpo.

## 8. Planejador e infraestrutura

O backend é pequeno, sem banco, RAG ou conversa persistida. As funções Vercel ficam em `api/accessibility/` na raiz canônica e reutilizam o mesmo handler exercitado pelo middleware Vite. Por padrão retorna `503` até que sejam configurados no servidor:

- `ACCESSIBILITY_LLM_ENDPOINT` para a base HTTPS do provedor; no Gemini nativo, `https://generativelanguage.googleapis.com/v1beta`;
- `ACCESSIBILITY_LLM_MODEL` definido explicitamente; prefira versão estável e registre quando usar um alias `latest` mutável;
- `ACCESSIBILITY_LLM_API_KEY` secreta.

Quando o host é `generativelanguage.googleapis.com`, `provider.ts` chama `models/{model}:generateContent`, envia a chave apenas no header `x-goog-api-key`, separa `systemInstruction` de `contents` e pede `application/json` com schema de objeto. Somente uma candidata com `finishReason=STOP` e JSON válido avança; bloqueio, truncamento, vazio, HTTP não 2xx ou JSON malformado falham fechados. O schema runtime local continua sendo a autoridade. Outros endpoints HTTPS mantêm a compatibilidade anterior com Chat Completions.

O handler recusa origem ausente/não autorizada, exige `application/json`, lê no máximo 16 KiB e aplica uma quota em memória por instância. Defaults: 12 chamadas/minuto por IP e 200/dia; podem ser ajustados por `ACCESSIBILITY_LLM_REQUESTS_PER_MINUTE` e `ACCESSIBILITY_LLM_REQUESTS_PER_DAY`. `ACCESSIBILITY_ALLOWED_ORIGINS` acrescenta origens explícitas quando um proxy confiável faz a origem do navegador divergir da URL recebida pela função; essa opção valida a origem, mas não habilita CORS nem preflight para um frontend hospedado em outro site. Esses limites locais são defesa em profundidade e não substituem quota/budget no projeto Google nem rate limit persistente/WAF no host antes de exposição pública.

Limites por pedido: uma chamada, timeout de 10 s no servidor e 12 s no cliente, saída máxima de 1.024 tokens, `store=false` no Gemini e nenhum retry automático pago. O payload não fixa `temperature`, `topP`, `topK` nem `candidateCount`; para IDs Gemini 3 e `gemini-flash-latest`, usa `thinkingLevel=low` para reservar o teto curto à resposta e reduzir custo/latência. Mensagens, conteúdo, respostas brutas, áudio e chaves não entram em logs. Telemetria possível: ID efêmero, duração, contagens, versão e status.

O cliente usa `AbortController`, uma requisição ativa e token de sessão. Fechar, navegar ou fazer alteração manual aborta e invalida resposta posterior.

## 9. Voz

O adaptador de voz usa `SpeechRecognition`/`webkitSpeechRecognition` somente após clique explícito. Estado: `unsupported | idle | listening | transcript_ready | error`. Fechar o painel chama `abort()`; a transcrição fica editável e só é enviada após confirmação. O painel informa suporte desigual e possível processamento remoto do navegador. Nenhum áudio é persistido.

## 10. Segurança e acessibilidade

- mensagens renderizadas como texto;
- JavaScript remoto da Rybená e a consulta à URL tokenizada só ocorrem após ação explícita na ferramenta de Libras;
- nenhum DOM completo, screenshot ou formulário sai da página;
- não há credenciais versionadas, em variáveis `VITE_*` ou embutidas no bundle estático; `RYBENA_ACCESS_TOKEN` existe somente no runtime do servidor e sua URL de uso não entra em logs/evidências;
- foco não é movido a cada mensagem; região viva anuncia apenas resumo;
- acionador fixo à esquerda e fora do header; desktop não modal; mobile modal com foco, Escape e retorno;
- no modo de seleção, o painel recolhe, deixa de bloquear a página e retorna com foco no campo do termo após captura ou cancelamento;
- fechar invalida operações e preserva preferências;
- guia/máscara ficam abaixo de diálogos e foco;
- o plugin não certifica o site nem a tradução.

## 11. Critério técnico Rybená

Passam localmente: contrato, isolamento, handler desativado sem configuração, método, host HTTPS exato, headers de segurança, construção/validação estrita da URL, mapeamento dos métodos com runtime falso, atribuição, falha explícita e independência do núcleo.

A rota local sem token teve smoke `503`/`405`. Fetch pelo navegador, injeção DOM, download do CDN, globals do fornecedor, preparação e player real permanecem **NOT RUN** até configurar a Vercel e executar o smoke no hostname autorizado. Envio aceito, tradução, pause/resume/stop, velocidade e eventos de conclusão continuam não validados; qualidade linguística requer homologação com pessoas surdas sinalizantes.
