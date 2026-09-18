# SDD — Acessibilidade Assistida por IA

Versão 2.2 · 17 de setembro de 2026 · Documento normativo de engenharia.

## 1. Estado inspecionado

A aplicação usa React 18, TypeScript e Vite. A réplica possui a jornada `search → results → seats → checkout → confirmation`, tokens, preferências v3 e componentes reaproveitáveis.

Classificação da auditoria Rybená:

- integração demonstrativa: adaptador real carregado sob demanda a partir do CDN público;
- métodos confirmados: `openPlayer`, `closePlayer`, `switchToLibras`, `translate`, `pause`, `play`, `stop`, `setSpeed`, `handleLoaded` e `handleTranslate`;
- mock/double: nenhum em produção;
- autorização real: `127.0.0.1` recusado pelo fornecedor com “Token Rybená não autorizado”;
- limites atuais: URL `master/latest` não versionada, domínio/token pendente e tradução não homologada;
- legado VLibras: removido da árvore atual; existia no `HEAD` e incluía helper não documentado.

Nenhum VLibras é carregado. O script Rybená só entra após clique explícito em “Traduzir trecho em Libras”; não há polling nem retry automático.

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
                                      └─ LibrasPort → RybenaBrowserAdapter sob demanda
```

O núcleo não importa dados comerciais nem executa navegação. Contratos de planejamento, explicação e simplificação são distintos. Falhas de IA e Rybená são independentes.

Organização implementável:

```text
app/src/features/accessibility-agent/
  core/contracts.ts
  core/preferences.ts
  core/executor.ts
  core/glossary.ts
  client/plannerClient.ts
  adapters/clickbus/content.ts
  adapters/libras/contracts.ts
  adapters/libras/rybenaBrowser.ts
  adapters/libras/rybenaUnavailable.ts
  ui/AccessibilityPanel.tsx
  ui/ContentTools.tsx
app/src/components/accessibility/AccessibilityPlugin.tsx
app/src/styles/accessibility-plugin.css
server/accessibility/handler.ts
server/accessibility/planner.ts
server/accessibility/prompt.ts
api/accessibility/plan.ts
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

Contrato estável:

```ts
type LibrasState =
  | 'idle' | 'unavailable_pending_provider_configuration'
  | 'loading' | 'ready' | 'translating' | 'paused' | 'failed';

interface LibrasAdapter {
  getSnapshot(): LibrasSnapshot;
  initialize(): Promise<LibrasReceipt>;
  open(): Promise<LibrasReceipt>;
  close(): Promise<LibrasReceipt>;
  translate(content: PublicContent): Promise<LibrasReceipt>;
  pause(): Promise<LibrasReceipt>;
  resume(): Promise<LibrasReceipt>;
  stop(): Promise<LibrasReceipt>;
  setSpeed(speed: LibrasSpeed): Promise<LibrasReceipt>;
  subscribe(listener: () => void): () => void;
}
```

Em produção, `RybenaBrowserAdapter` injeta uma única vez `rybena.js?mode=api`, define `doNotTrack="true"`, chama o carregador documentado com `hidden` e só então acessa `RybenaApi`. As operações mapeiam o contrato para os métodos oficiais. Timeout e `script.onerror` são finitos; não há polling nem retry automático. `RybenaUnavailableAdapter` permanece como fallback determinístico e apoio a testes.

Para tradução real, a Rybená ainda precisa autorizar o domínio da demonstração ou fornecer o token aplicável. Depois disso devem ser registrados limites, versão, procedimento de teste e homologação com pessoas surdas sinalizantes.

Doubles de Libras ficam exclusivamente em testes, nomeados `TestLibrasAdapter`, sem importação pelo bundle de produção.

## 8. Planejador e infraestrutura

O backend é pequeno, sem banco, RAG ou conversa persistida. Por padrão retorna `503` até que sejam configurados no servidor:

- `ACCESSIBILITY_LLM_ENDPOINT` para uma API explicitamente escolhida e compatível com Chat Completions;
- `ACCESSIBILITY_LLM_MODEL` fixado;
- `ACCESSIBILITY_LLM_API_KEY` secreta.

Antes de habilitar em hospedagem pública, o host também deve impor origens autorizadas, autenticação quando aplicável, limite de tamanho, rate limit/quota e orçamento. Essas proteções não são simuladas no frontend acadêmico.

Limites: uma chamada por pedido, timeout 12 s, saída ≈ 1.000 tokens, sem retry automático pago. Mensagens, conteúdo e áudio não entram em logs. Telemetria possível: ID efêmero, duração, contagens, versão e status.

O cliente usa `AbortController`, uma requisição ativa e token de sessão. Fechar, navegar ou fazer alteração manual aborta e invalida resposta posterior.

## 9. Voz

O adaptador de voz usa `SpeechRecognition`/`webkitSpeechRecognition` somente após clique explícito. Estado: `unsupported | idle | listening | transcript_ready | error`. Fechar o painel chama `abort()`; a transcrição fica editável e só é enviada após confirmação. O painel informa suporte desigual e possível processamento remoto do navegador. Nenhum áudio é persistido.

## 10. Segurança e acessibilidade

- mensagens renderizadas como texto;
- JavaScript remoto da Rybená só é executado após ação explícita na ferramenta de Libras;
- nenhum DOM completo, screenshot ou formulário sai da página;
- não há credenciais no frontend ou em variáveis `VITE_*`;
- foco não é movido a cada mensagem; região viva anuncia apenas resumo;
- acionador fixo à esquerda e fora do header; desktop não modal; mobile modal com foco, Escape e retorno;
- no modo de seleção, o painel recolhe, deixa de bloquear a página e retorna com foco no campo do termo após captura ou cancelamento;
- fechar invalida operações e preserva preferências;
- guia/máscara ficam abaixo de diálogos e foco;
- o plugin não certifica o site nem a tradução.

## 11. Critério técnico Rybená

Podem passar nesta entrega: contrato, isolamento, carregamento sob demanda, mapeamento dos métodos, atribuição, ausência de retries, falha de autorização explícita e independência do núcleo.

O CDN e a falha real do serviço foram exercitados. Permanecem **BLOCKED / NOT VALIDATED — provider domain or token not authorized**: envio aceito, tradução, player, pause/resume/stop, velocidade, eventos de conclusão e qualidade linguística.
