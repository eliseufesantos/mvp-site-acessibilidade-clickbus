# SDD — Acessibilidade Assistida por IA

Versão 2.0 · 9 de setembro de 2026 · Documento normativo de engenharia.

## 1. Estado inspecionado

A aplicação usa React 18, TypeScript e Vite. A réplica já possui a jornada `search → results → seats → checkout → confirmation`, tokens e componentes reaproveitáveis. A árvore de trabalho anterior introduziu preferências v2 planas, um painel com interpretação local e um arquivo `rybena.ts` que usa URL pública e métodos presumidos.

Classificação da auditoria Rybená:

- integração real comprovada: nenhuma;
- estrutura preparatória útil: estado React e fronteira de funções do arquivo atual;
- mock/double: nenhum em produção;
- chamada experimental/não verificada: injeção de script, polling a cada 100 ms e chamadas de métodos presumidos;
- código especulativo: URL fixa e interfaces não confirmadas pelo material operacional fornecido ao projeto;
- legado VLibras: removido da árvore atual; existia no `HEAD` e incluía helper não documentado.

A chamada experimental deve ser desativada. Nenhum script Rybená ou VLibras é carregado nesta versão.

## 2. Arquitetura

```text
Painel
  ├─ controles manuais ───────────────┐
  ├─ cliente do planejador → /api → LLM configurada
  ├─ explicação/simplificação → /api quando necessário
  └─ voz → transcrição editável       │
                                      ↓
                            executor determinístico
                                      ├─ store v3 → adaptador ClickBus → tokens
                                      └─ LibrasPort → RybenaAdapter indisponível
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
  adapters/libras/rybenaUnavailable.ts
  ui/AccessibilityPanel.tsx
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

Explicação usa `POST /api/accessibility/explain` com `{term, context, contentRef}`. Simplificação usa `POST /api/accessibility/simplify` com `{text, contentRef}`. Esses endpoints não retornam ações e seus clientes nunca passam respostas ao executor.

## 6. Adaptador do hospedeiro

```ts
interface AccessibilityHostAdapter {
  getPageEpoch(): number;
  getContentTargets(): readonly ContentTarget[];
  resolveContent(id: string): string | null;
  getCapabilities(): readonly ActionType[];
}
```

O adaptador ClickBus mantém registro fechado de conteúdo público revisado: `search-help`, `results-help`, `itinerary-help`, `service-class-help` e `seat-map-help`, conforme a página atual. Não lê `document.body.innerText` nem consulta seletores livres. Inputs, checkout, passageiro, bilhete, preço, pagamento e conteúdo oculto são excluídos.

Seleção do mouse só é aceita quando inteiramente contida em um alvo registrado. A lista acessível é o caminho alternativo por teclado. Texto máximo: 1.500 caracteres, sem truncamento silencioso. Conteúdo é dado, nunca instrução.

## 7. Libras e Rybená

Contrato estável:

```ts
type LibrasState =
  | 'unavailable_pending_provider_configuration'
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

Nesta entrega, `RybenaUnavailableAdapter` retorna de forma idempotente `unavailable_pending_provider_configuration` em todas as operações. Não injeta script, não faz fetch/polling/retry, não expõe controles que aparentem funcionar e não traduz conteúdo. O estado não é logado como erro recorrente.

Ativação futura exige, conforme o fornecedor: credencial/chave, cliente/projeto, endpoint, versão oficial de API/SDK/player, URL de script, domínio autorizado, CORS/origem, ambiente de homologação, configuração do player, métodos e eventos confirmados, limites/restrições, política de dados, procedimento de teste e contato de suporte. Somente após receber isso será criado um adaptador real atrás do mesmo contrato.

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
- nenhum HTML, CSS ou JavaScript remoto é executado;
- nenhum DOM completo, screenshot ou formulário sai da página;
- não há credenciais no frontend ou em variáveis `VITE_*`;
- foco não é movido a cada mensagem; região viva anuncia apenas resumo;
- desktop não modal; mobile modal com foco, Escape e retorno;
- fechar invalida operações e preserva preferências;
- guia/máscara ficam abaixo de diálogos e foco;
- o plugin não certifica o site nem a tradução.

## 11. Critério técnico Rybená

Podem passar nesta entrega: contrato, isolamento, estado indisponível, atribuição, ausência de retries e independência do núcleo.

Permanecem **BLOCKED / NOT VALIDATED — provider API not yet released/configured**: conexão, envio, tradução, player, pause/resume/stop, velocidade, eventos e falhas reais do serviço.
