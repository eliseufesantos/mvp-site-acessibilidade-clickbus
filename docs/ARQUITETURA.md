# Arquitetura

Como o código está organizado e quais regras ele garante. As regras operacionais para agentes ficam no [`AGENTS.md`](../AGENTS.md).

## Stack

- React 18 e TypeScript estrito, com Vite 6;
- CSS próprio organizado por tokens, sem biblioteca de componentes;
- Lucide React para ícones e Fontsource para Rubik e Roboto Mono locais;
- funções Vercel em TypeScript para o servidor;
- Vitest (com jsdom) e Playwright (com axe-core) para testes.

## Estrutura

```text
.
├── api/accessibility/            # wrappers Vercel: plan, explain, simplify, rybena
├── app/
│   ├── server/accessibility/     # handler, prompts, provedor LLM e configuração Rybená
│   ├── e2e/                      # testes Playwright
│   └── src/
│       ├── app/App.tsx           # estado e navegação da jornada
│       ├── components/           # marca, layout e UI genérica
│       ├── data/trips.ts         # viagens fictícias, fonte única
│       ├── features/
│       │   ├── search/ results/ seats/ checkout/ confirmation/
│       │   └── accessibility-agent/
│       │       ├── core/         # contratos, preferências, executor, glossário, cliente do planejador
│       │       ├── adapters/     # conteúdo ClickBus e porta Libras/Rybená
│       │       ├── ui/           # host do plugin, painel, ajudas de leitura, hooks e CSS
│       │       └── tests/
│       ├── styles/               # tokens, base global e componentes da jornada
│       └── types.ts
├── docs/
└── academico/                    # material da disciplina, fora do build
```

As funções precisam ficar em `api/` na raiz por exigência da Vercel. Elas só repassam a chamada aos handlers de `app/server/`, que também são montados como middleware no `vite dev`. Não recrie `app/api/`.

## Jornada

`App.tsx` é uma máquina de estados linear com cinco etapas, sem React Router: a jornada é única e linear, e isso evita dependência.

- Busca, viagem e assento ficam em estado React.
- Ao trocar de etapa, a página volta ao topo, o foco vai para o conteúdo principal e o `pageEpoch` avança.
- Componentes de `components/ui/` não conhecem regra da jornada.
- Cada feature recebe dados e callbacks por propriedades.

## Plugin de acessibilidade

```text
acionador (header) ── painel
                       ├─ ajustes manuais ─────────────────┐
                       ├─ chat → cliente do planejador → /api/accessibility/plan → LLM
                       └─ cartões Libras/Voz ──────────┐   │
                                                       ↓   ↓
                                             executor determinístico
                                               ├─ preferências v4 → atributos data-* no <html>
                                               ├─ glossário e simplificação revisada (local)
                                               ├─ /api/accessibility/explain e simplify (só se faltar resposta local)
                                               └─ RybenaAdapter → GET /api/accessibility/rybena → CDN
```

- **Host.** O `AccessibilityPlugin` é dono do estado do painel e projeta o acionador para `#accessibility-trigger-slot`, no `Header`, com `createPortal`. Se o encaixe faltar, o acionador é renderizado no próprio host: esse controle nunca pode sumir.
- **Superfícies.** O painel tem uma superfície ativa por vez (`root`, `settings` ou `about`).
  - Toda entrada da raiz tem `id="a11y-card-<superfície>"`, para o foco voltar a ela.
  - O primeiro focável de cada superfície carrega `data-a11y-entry`.
  - O campo do chat é `#accessibility-request`.
- **Estilo do acionador.** O contador é estilizado pela classe do próprio botão (`.accessibility-plugin__trigger-badge`), nunca por um seletor ancorado no host: o portal tira o botão de dentro dele.

### Preferências

- Persistidas em `clickbus-a11y-v4`, com migração de v1, v2 e v3 e fallback em memória quando o armazenamento está bloqueado. Há uma revisão monotônica.
- O hook `useAccessibilityPreferences` é o único que grava preferências e altera atributos no `<html>`. Os efeitos são CSS declarativo sobre atributos `data-*`.
- Saturação e correção de cores usam `backdrop-filter` numa camada fixa, `.color-filter-layer`, com z-index 898 e `pointer-events: none`. **Nunca** use `filter` num ancestral: ele vira bloco de contenção para descendentes `position: fixed`, e painel, diálogos e máscara deixariam de se posicionar pela viewport.
- Ordem das camadas: painel 950, guia 900, máscara 899, filtro de cor 898. Os próprios controles de acessibilidade continuam legíveis.
- A correção de cores usa daltonização, `D = I + E·(I − S)`, e **nunca** matrizes de simulação de dicromacia. Um teste mede a separação percebida em oito pares e reprova matriz que baixe a média ou piore o pior par.

### Contrato do planejador

Versão **2.2**, com 19 ações:

| Grupo | Ações |
| --- | --- |
| Preferências | `set_preferences`, `apply_comfortable_reading`, `undo_preferences`, `reset_preferences` |
| Libras | `open_libras`, `close_libras`, `translate_content`, `pause_libras`, `resume_libras`, `stop_libras`, `set_libras_speed` |
| Voz | `open_voice`, `close_voice`, `speak_content`, `pause_voice`, `resume_voice`, `stop_voice` |
| Conteúdo | `explain_term`, `simplify_content` |

- O servidor e o executor validam o esquema com chaves fechadas.
- O executor também revalida capacidades, página, sessão, revisão e `planId` antes de qualquer efeito. Um `planId` repetido não aplica duas vezes. Lote inválido não produz efeito nenhum.
- Plano de versão anterior é recusado: o servidor responde `400` e o executor rejeita antes de qualquer efeito.
- **Limites:** mensagem até 1.000 caracteres, termo até 120, contexto até 500 e trecho para simplificar até 1.500.
- **Conteúdo público:** só os alvos registrados em `adapters/clickbus/content.ts` (`search-help`, `results-help`, `service-class-help` e `seat-map-help`), conforme a etapa. Checkout e confirmação não têm alvo. O texto do conteúdo é tratado como dado, nunca como instrução.
- O mesmo esquema é enviado ao Gemini em `responseJsonSchema`, derivado das constantes dos validadores. Ele orienta o modelo, mas **não** substitui a revalidação.

### Servidor e Gemini

O servidor é configurado só por variáveis de ambiente:

```text
ACCESSIBILITY_LLM_ENDPOINT    # Gemini: https://generativelanguage.googleapis.com/v1beta
ACCESSIBILITY_LLM_MODEL
ACCESSIBILITY_LLM_API_KEY
```

- Sem as três, o servidor responde `503` e os controles manuais continuam funcionando. Nunca use `VITE_*` para segredo.
- Com o host do Google, o adaptador nativo chama `models/{model}:generateContent`:
  - a chave vai só no header `x-goog-api-key`;
  - a saída é JSON estruturado, com teto de 4.096 tokens (os tokens de raciocínio contam nesse limite);
  - `thinkingLevel: 'LOW'` é enviado apenas para a família Gemini 3;
  - `store: false`.
- Outros endpoints HTTPS usam o caminho compatível com Chat Completions.
- **Retry:** uma única repetição, só para HTTP 503 e 429, respeitando `retry-after` com teto de 2 s e abortando junto com o pedido. Esses status são recusas anteriores à geração, então repetir não duplica custo. Não há retry em 4xx determinístico, nem laço, nem polling.
- **Timeouts:** 10 s no servidor e 12 s no cliente.
- **Erros:** respostas `502` carregam um `code` estável (`provider_http_429`, `provider_incomplete_response`, `provider_timeout`, `contract_mismatch`, `provider_failed`) sem conteúdo de prompt nem de configuração.
- **Proteções do handler:**
  - exige origem autorizada (`403`) e `application/json` (`415`);
  - limita o corpo a 16 KiB (`413`);
  - aplica quota por instância: 12 chamadas por minuto por IP e 200 por dia.
- **Ajustes da quota:** `ACCESSIBILITY_LLM_REQUESTS_PER_MINUTE`, `ACCESSIBILITY_LLM_REQUESTS_PER_DAY` e `ACCESSIBILITY_ALLOWED_ORIGINS`. Essa quota é só defesa em profundidade numa função stateless.
- Mensagens, conteúdo, respostas brutas, áudio e chaves não entram em log.

### Rybená

O port é `RybenaAdapter`, em `adapters/libras/`, com `setMode('libras' | 'voz')` mapeado para `switchToLibras()` e `switchToVoz()`. Há três implementações:

| Implementação | Papel |
| --- | --- |
| `RybenaBrowserAdapter` | produção |
| `RybenaUnavailableAdapter` | fallback determinístico e apoio a testes |
| `RybenaDevelopmentAdapter` | simulação sem rede para desenvolvimento, com aviso permanente |

- **O port não declara os métodos visuais da Rybená** (`toggleZoom`, `toggleDarkContrast` e semelhantes), e o executor nunca os chama. Um teste monta um runtime falso com os 16 métodos visuais documentados e afirma que nenhum é tocado.
- **Troca de modo.** As ações de entrada (`open_*`, `translate_content`, `speak_content`) trocam o modo antes de agir. As de transporte (`pause_*`, `resume_*`, `stop_*`) só agem se o player já estiver no modo pedido.
- **Seleção do adaptador.** A escolha fica em `selection.ts` e é **código de segurança**.
  - `import.meta.env.DEV` aparece literalmente no ternário, para o empacotador dobrar a condição e remover o double do bundle de produção. Não extraia essa checagem para `shouldSimulateLibras`.
  - A simulação exige também `VITE_A11Y_LIBRAS_SIMULATION=on`, uma flag que não é segredo.
  - Depois de um build limpo, procure `RybenaDevelopment` em `app/dist/assets/index-*.js`: não pode haver ocorrência.
- **Configuração.** `GET /api/accessibility/rybena` lê `RYBENA_ACCESS_TOKEN` só no servidor e responde com `no-store`, `Cross-Origin-Resource-Policy: same-origin` e `nosniff`.
  - A resposta traz a URL fixa do CDN com `token`, `mode=full` (a interface da Rybená aparece e a seleção é dela), `disableAccessibilityButton=true` (remove os ajustes visuais da barra do fornecedor) e `doNotTrack=true`.
  - Com credencial, só é aceito HTTPS no hostname exato `mvp-site-acessibilidade-clickbus-lovat.vercel.app`; localhost, aliases e previews são recusados. Sem credencial válida, a resposta é `503`.
- **O token.** O parâmetro `token` não consta na documentação pública; foi confirmado por e-mail do fornecedor. O formato atual, 64 hexadecimais, é o que o código valida, mas nunca foi especificado e pode mudar numa rotação.
- **Carregamento.** O fetch da configuração expira em 10 s; download do script, preparação do player e espera do runtime expiram em 15 s cada. Se a tag carregar sem os globals esperados, ela é removida para permitir nova tentativa manual. Não há retry automático.
- Ao alterar o `mode`, atualize os dois validadores (servidor e navegador) e o teste que congela o formato da URL.

### Voz

"Voz" tem dois sentidos no projeto:

| | Origem | Onde |
| --- | --- | --- |
| Ditado (entrada) | Web Speech API do navegador | `ui/useVoiceInput.ts`, no chat |
| Narração (saída) | modo `voz` do player da Rybená | cartão Voz |

O ditado começa só por clique, mostra a transcrição editável e chama `abort()` ao fechar o painel. Nenhum áudio é persistido.

## Segurança

- Segredos existem só no runtime do servidor: nada em `VITE_*`, no bundle, no repositório, nos logs ou nas evidências.
- A URL tokenizada da Rybená fica visível na rede do navegador por exigência do fornecedor. Não salve HAR nem capturas de rede que a contenham.
- O modelo nunca recebe DOM, screenshots, formulários nem dados da jornada.
- Mensagens são renderizadas como texto.
- O plugin não altera busca, viagem, assento, passageiro nem preço.
