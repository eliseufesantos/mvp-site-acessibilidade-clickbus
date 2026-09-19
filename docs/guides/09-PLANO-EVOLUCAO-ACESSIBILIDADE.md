# 09 — Plano de evolução da acessibilidade assistida

Guia de execução para agentes de software. Consolida (a) os defeitos confirmados pela auditoria de 18/09/2026, (b) o desbloqueio das integrações Gemini e Rybená e (c) a reconstrução da experiência do plugin de acessibilidade no padrão de lançador + chat.

Este documento é a **fonte de verdade da tarefa**. O `AGENTS.md` continua sendo a fonte de verdade das **regras**. Em conflito, `AGENTS.md` vence e este arquivo deve ser corrigido.

---

## 1. Como usar este documento

Cada tarefa tem identificador (`T0.1`, `T1.2`…), arquivos-alvo, passos, critério de aceite e risco. Um agente deve:

1. ler `AGENTS.md` inteiro antes de editar qualquer coisa;
2. rodar `git status --short --branch` e preservar mudanças existentes;
3. executar **uma tarefa por vez**, na ordem das fases;
4. rodar a validação mínima ao final de cada tarefa;
5. marcar a tarefa na tabela de progresso e registrar `PASS` / `FAIL` / `NOT RUN` / `BLOCKED` com honestidade.

### Validação mínima obrigatória (toda tarefa)

```bash
npx --yes pnpm@10.28.0 --dir app typecheck
npx --yes pnpm@10.28.0 --dir app build
npx --yes pnpm@10.28.0 --dir app test:accessibility
```

Para tarefas que tocam funções de `api/`, adicionalmente:

```bash
./app/node_modules/.bin/tsc --noEmit -p tsconfig.json --pretty false
```

> Nunca use `npx tsc` sem caminho. O pacote `tsc` do npm **não é** o TypeScript e produz erros de sintaxe falsos. Use sempre o binário local acima.

### Paralelização: o que pode ser dividido e o que não pode

**Pode rodar em paralelo, um agente por tarefa.** As tarefas da Fase 1 tocam arquivos distintos e têm critério de aceite próprio: T1.1, T1.2, T1.4, T1.5, T1.6 e T1.7. T1.6 é a única que cruza vários arquivos, então dê-a a um agente sozinho para evitar conflito de edição.

**Não divida entre agentes.** A Fase 2 é **um** redesenho coerente com invariantes apertadas. T2.1 a T2.4 compartilham o mesmo componente, o mesmo CSS e o mesmo modelo de foco; repartir entre agentes produz superfícies que não conversam e perde a acessibilidade já auditada. Um agente executa a Fase 2 inteira, na ordem.

**T1.8 fica de fora da paralelização.** O critério de aceite dela exige julgamento humano sobre qualidade de texto, que nenhum agente fecha sozinho. Trate como tarefa acompanhada.

**Ordem obrigatória.** T0.0 antes de tudo. T0.3 antes de qualquer trabalho de Fase 2 que toque Libras ou voz, porque sem o adaptador falso não há como exercitar esses caminhos fora do domínio autorizado. T2.3 antes de T2.4.

**Ao despachar um agente**, passe o identificador da tarefa e o caminho deste arquivo. Ele deve ler o `AGENTS.md` e a tarefa inteira antes de editar, e não deve expandir o escopo para tarefas vizinhas.

### Painel de progresso

| ID | Tarefa | Fase | Status |
|----|--------|------|--------|
| **T0.0** | **Corrigir `.vercelignore` — funções quebradas em produção** | **0** | **PASS 19/09 — verificado em produção, ver 5.1** |
| T0.1 | Corrigir enum `thinkingLevel` do Gemini | 0 | PASS 19/09 — aceito pelo provedor em chamada real |
| T0.2 | Smoke real do Gemini | 0 | PASS 19/09 em produção, ver 5.2 — `.env` local segue pendente |
| T0.3 | Adaptador Libras de desenvolvimento (fake) | 0 | PASS 19/09 — exercitado no navegador, ver 5.5 |
| T0.4 | Deploy e smoke real da Rybená no domínio autorizado | 0 | endpoint 200 e player aberto no navegador 19/09 — falta evidência registrada |
| T1.1 | `aria-label` descartado em `<div>` (14 casos) | 1 | PASS 19/09 — rótulos presentes na árvore |
| T1.2 | Anúncio de filtragem nos resultados | 1 | PASS 19/09 — 1 anúncio atômico por filtro |
| T1.3 | ~~`.vercelignore`~~ — promovida para **T0.0** | 1 | reclassificada |
| T1.4 | Remover diretório morto `app/api/` | 1 | PASS 19/09 |
| T1.5 | Atualizar snapshot do `AGENTS.md` | 1 | PASS 19/09 |
| T1.6 | Foco independente de `requestAnimationFrame` | 1 | PASS 19/09 — verificado com rAF desligado |
| T1.7 | Correções menores agrupadas | 1 | PASS 19/09 |
| T1.8 | Revisar prompts de explicação e simplificação | 1 | prompt reescrito 19/09 — **avaliação semântica humana pendente** |
| T2.1 | Acionador circular e grade de recursos | 2 | PASS 19/09 — ver 7.6 |
| T2.2 | Chat assistente com ditado por voz | 2 | PASS 19/09 — ver 7.6 |
| T2.3 | Capacidade de voz no contrato e no executor | 2 | PASS 19/09 — contrato 2.1, ver 7.6 |
| T2.4 | Roteamento do chat para ferramentas, Libras e voz | 2 | PASS 19/09 em desenvolvimento, ver 7.6 |
| T3.1 | Regressão integral e evidências | 3 | PASS 19/09 com ressalvas explícitas, ver 8.1 |

---

## 2. Contexto verificado

Auditoria executada em 18/09/2026 sobre `HEAD = e8da138`, árvore limpa e sincronizada com `origin/main`.

**O que está comprovadamente saudável** — não regrida nada disto:

- `typecheck`, `build` (1.616 módulos) e `test:accessibility` (24/24) passam;
- jornada completa busca → resultados → assento → passageiro → confirmação funciona;
- axe-core 4.10.2 (WCAG 2.0/2.1/2.2 nível A e AA) em 5 telas: **0 violações**;
- foco vai para `main#main-content` e `scrollY = 0` a cada troca de etapa;
- reflow em 320×844 com texto a 150% e alto contraste: 0 px de overflow;
- painel é modal (`role="dialog"`, `aria-modal`, backdrop, body travado) em ≤ 820 px e região não modal em ≥ 821 px;
- endpoints devolvem 403 (origem), 405, 415, 413 (> 16 KiB) e 503 honesto, todos `application/json`;
- checkout e confirmação não expõem `data-a11y-content-id` e o nome do passageiro não vaza na confirmação;
- formulário de passageiro tem `role="alert"`, `aria-invalid` e `aria-describedby` por campo;
- controles do painel têm `aria-labelledby` nos switches e `role="group"` com `aria-label` nos segmentados;
- contraste do herói sobre a foto: mínimo real de 8,13:1 por amostragem de pixels, não é problema.

**Decisões do responsável pelo projeto**, tomadas em 18/09/2026:

- chave da API do Gemini: **disponível**;
- token Rybená e acesso ao projeto Vercel do domínio autorizado: **válidos**;
- ordem de trabalho: **encanamento primeiro, UX depois**.

---

## 3. Regras inegociáveis

Herdadas do `AGENTS.md`, repetidas aqui porque são as que mais correm risco nesta tarefa:

1. **Nenhum segredo no repositório.** Nem em código, nem em documentação, nem em evidências, nem em logs. Nada de `VITE_*` para credencial.
2. **Não faça commit, push ou deploy sem pedido explícito** do responsável.
3. **Não invente métodos de fornecedor.** Se a API da Rybená não documenta um método, ele não existe. Não substitua por VLibras e não simule tradução.
4. **Não declare conformidade WCAG, IA real ou tradução Libras sem evidência registrada.**
5. **Doubles não provam integração.** Um teste com transporte falso prova formato, não conectividade.
6. **Checkout, passageiro, bilhete, preço, pagamento e confirmação nunca vão para o planejador nem para as ferramentas de conteúdo.**
7. **A LLM é apenas planejadora.** Não recebe ferramentas de DOM, navegação ou comércio, e não gera CSS ou JavaScript executável. O executor local revalida esquema, capacidades, página, sessão, revisão e `planId` antes de qualquer efeito.
8. **Não substitua conteúdo original** por texto explicado ou simplificado; apresente a saída separadamente.
9. Preserve o crédito "Tradução em Libras por Rybená".

---

## 4. Diagnóstico: por que Gemini e Rybená não funcionam hoje

Ponto de partida obrigatório. Medido em 19/09/2026 contra o site publicado.

### 4.0 A causa raiz: as funções nem chegam a executar em produção

Este é o achado principal e explica por que colocar a chave na Vercel não resolveu nada.

Sondagem do domínio autorizado:

```text
GET /                              -> 200 text/html          (SPA funciona)
GET /api/nao-existe                -> 404                    (roteamento funciona)
GET /api/accessibility/plan        -> 500 text/plain
GET /api/accessibility/explain     -> 500 text/plain
GET /api/accessibility/simplify    -> 500 text/plain
GET /api/accessibility/rybena      -> 500 text/plain
X-Vercel-Error: FUNCTION_INVOCATION_FAILED
tempo: 0,32 s constante nas três tentativas
```

Como ler isso:

- não é 404, então **as funções existem e estão roteadas**;
- um `GET` deveria devolver `405 application/json` pelo nosso handler, e `rybena` deveria devolver `503 application/json`. Devolvem `500 text/plain` gerado pela borda da Vercel. Portanto **nenhuma linha do nosso código executa**;
- 0,32 s constante, sem variação de cold start, indica **falha na carga do módulo**, não erro de lógica em execução;
- todas as quatro funções falham igual, o que aponta para causa comum, não para bug em uma delas.

**Consequência direta:** a chave do Gemini e o `RYBENA_ACCESS_TOKEN` configurados na Vercel são irrelevantes enquanto isso durar. O processo morre antes de ler qualquer variável de ambiente. Não adianta mexer em credencial.

**Causa mais provável, com suporte documental.** A documentação da Vercel afirma, para funções Node, que `{"type": "module"}` no `package.json` é *"required (...) to ensure ES module support"*. No projeto, o único arquivo que declara isso é o `package.json` da raiz — e o `.vercelignore` o exclui, porque começa com `*` e re-inclui somente `app/`, `api/` e `vercel.json`. Sem essa declaração, a saída é carregada como CommonJS, o `import` no topo dos wrappers lança erro de sintaxe na carga, e o resultado é exatamente `FUNCTION_INVOCATION_FAILED` rápido e determinístico em todas as funções.

A hipótese concorrente foi **descartada**: a documentação oficial confirma que `export default { fetch(request: Request) }` é assinatura suportada para funções Node, então o formato dos wrappers não é o problema.

Corrija isso primeiro (T0.0). Só depois faz sentido investigar credenciais.

### 4.1 Gemini — configuração e um defeito latente

No ambiente **local** não existe nenhuma credencial: nem variável exportada, nem arquivo `.env`. Na **Vercel** a chave foi configurada pelo responsável, mas não há como confirmar o efeito enquanto T0.0 não for resolvida.

Atenção a uma armadilha: `readConfiguration()` exige as **três** variáveis — `ACCESSIBILITY_LLM_ENDPOINT`, `ACCESSIBILITY_LLM_MODEL` e `ACCESSIBILITY_LLM_API_KEY`. Se apenas a chave estiver definida, `getConfiguredProvider()` devolve `null` e o handler responde 503, mesmo com a chave correta. Depois de T0.0, **confira os três nomes** antes de concluir qualquer coisa sobre a chave.

Sobre a origem da chave: o endereço indicado pelo responsável (`aistudio.google.com/docs/api-key`) **é o correto e aplicável**. A chave do AI Studio atende a Gemini Developer API em `generativelanguage.googleapis.com`, autenticada pelo header `x-goog-api-key` — exatamente o que `provider.ts` faz. Não há incompatibilidade aqui.

O defeito latente aparece **depois** de configurar a chave. O discovery document ao vivo de `generativelanguage.googleapis.com/$discovery/rest?version=v1beta` declara:

```text
ThinkingConfig.thinkingLevel  enum:
  THINKING_LEVEL_UNSPECIFIED | MINIMAL | LOW | MEDIUM | HIGH
```

O código envia `'low'` em minúsculas (`app/server/accessibility/provider.ts:144`) e o teste congela esse valor contra um transporte falso (`app/src/features/accessibility-agent/tests/run.ts:198`). O parser de enum do frontend da Google é sensível a caixa. É exatamente o cenário que o `AGENTS.md` adverte: suíte verde, chamada real quebrada.

A mesma spec acrescenta, sobre `thinkingLevel`: *"Recommended for Gemini 3 or later models. Use with earlier models results in an error."* O código aplica o campo quando o modelo é `gemini-flash-latest`, que é **alias mutável** e pode apontar para um modelo anterior ao Gemini 3. Isso não degrada a qualidade: derruba a chamada.

Para registro, o restante do corpo enviado **confere** com a spec publicada e não deve ser mexido: `store`, `systemInstruction`, `contents`, `generationConfig`, `responseJsonSchema`, `responseMimeType`, `maxOutputTokens`. O campo `responseSchema` está deprecado na API e o código corretamente não o usa.

### 4.2 Rybená — desenvolvimento local impossível, e um parâmetro fora da documentação

`app/server/accessibility/rybena.ts:42` exige que a requisição chegue por `https:` **e** com hostname exatamente igual a `mvp-site-acessibilidade-clickbus-lovat.vercel.app`. Em `127.0.0.1:4173` nenhuma dessas condições é satisfeita, então a resposta nunca pode ser diferente de 503 ou 403.

Liberar o host no handler **não resolve**: o `AGENTS.md` registra que, em teste histórico em `127.0.0.1`, o script até carregou, mas **o fornecedor recusou a origem**. A barreira é do lado da Rybená, não do nosso handler.

**Consequência para o plano:** toda a UX que depende de Libras e voz precisa ser desenvolvida contra um adaptador falso local (T0.3), e a integração real só pode ser validada por deploy no domínio autorizado (T0.4). Qualquer agente que tentar "fazer a Rybená funcionar em localhost" vai perder tempo e não vai conseguir.

#### O `token` na URL está correto — confirmado pelo fornecedor

A documentação pública não menciona `token` em lugar nenhum. A lista oficial completa de parâmetros é:

```text
positionPlayer, positionPlayerMobile, positionBar, offsetTopBar,
offsetX, offsetY, size, backgroundColorBar, zIndexBar, renderTimeout,
mode, lang, disableLibrasButton, disableVoiceButton,
disableAccessibilityButton, doNotTrack
```

Mas o **e-mail de provisionamento da Rybená**, recebido pelo responsável, instrui explicitamente:

```html
<script
  type="text/javascript"
  src="https://cdn.rybena.com.br/dom/master/latest/rybena.js?token=SEU_TOKEN"
></script>
```

e informa que o domínio `mvp-site-acessibilidade-clickbus-lovat.vercel.app` **já está ativo na plataforma deles**, que o parâmetro é aplicado automaticamente, que o script autentica a aplicação usando esse token via header `X-API-Key` e recebe a sessão pronta, e que a barra de acessibilidade aparece no canto da tela com LIBRAS, Voz e Visão.

**Conclusão:** o `token` como parâmetro de URL está correto. É um canal de provisionamento fora da documentação pública, específico do regime de exceção acadêmica. Não remova o parâmetro.

#### Formato do token: hipótese levantada e **descartada** em 19/09/2026

> **Resultado da verificação:** `comprimento = 64`, `somenteHex = True`, `passaNoRegexAtual = True`.
> O token real **passa** na validação do código. Esta hipótese está encerrada — **não a investigue de novo**.
>
> Consequência: do lado da Rybená resta apenas **T0.0** (as funções não carregam) e, depois dela, a questão de `mode=api` logo abaixo.

O parágrafo a seguir fica registrado porque o acoplamento continua existindo e pode voltar a morder quando o token for rotacionado ou substituído.

O código exige que o token case com `/^[a-f0-9]{64}$/i` — **exatamente 64 caracteres hexadecimais** — e faz essa checagem em **dois** lugares:

```text
app/server/accessibility/rybena.ts:4            const RYBENA_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
app/server/accessibility/rybena.ts:20           if (!RYBENA_TOKEN_PATTERN.test(...)) return null;
adapters/libras/rybenaBrowser.ts:8              const RYBENA_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
adapters/libras/rybenaBrowser.ts:82             || !RYBENA_TOKEN_PATTERN.test(token)
```

Esse formato foi **presumido**, não especificado pelo fornecedor: o e-mail apenas diz `token=SEU_TOKEN`, sem definir comprimento ou alfabeto. O token atual casa por coincidência ou por convenção não documentada — não por contrato.

**Se um token futuro não for exatamente 64 hex**, a cadeia de falha é silenciosa e enganosa:

1. `buildRybenaScriptUrl()` devolve `null`;
2. `handleRybenaRequest()` responde `503 "A integração Rybená ainda não foi configurada."`;
3. essa mensagem é **indistinguível** de "nenhum token foi configurado" — então o responsável conclui que a variável não pegou, quando na verdade ela pegou e foi rejeitada pelo nosso próprio regex.

**Verificação segura, para repetir a cada rotação de token.** Este comando imprime apenas metadados e **nunca** o valor:

```powershell
$t = (Read-Host "Cole o token da Rybena").Trim(); [pscustomobject]@{ comprimento = $t.Length; somenteHex = [bool]($t -match '^[a-f0-9]+$'); passaNoRegexAtual = [bool]($t -match '^[a-f0-9]{64}$') }
```

`Read-Host` mantém o valor fora do histórico do shell. Se `passaNoRegexAtual` for `false`, o regex precisa ser corrigido para o formato real. Ao corrigir:

- **não** troque por algo permissivo como `/.+/`. O objetivo do padrão é impedir injeção na query string;
- restrinja a um alfabeto seguro e a um intervalo de comprimento, por exemplo `/^[A-Za-z0-9._-]{16,256}$/`;
- atualize os dois arquivos e o teste em `tests/run.ts:304`, que hoje congela o formato de 64 hex.

#### `mode=api` versus o comportamento descrito pelo fornecedor

O código força `mode=api` e `doNotTrack=true` além do token. Ambos são parâmetros documentados, mas há uma tensão a verificar:

- o e-mail descreve que **a barra de acessibilidade aparece** com LIBRAS, Voz e Visão — comportamento de `mode=full`, que é o padrão;
- `mode=api` faz o oposto: abre em background, remove os textos de apresentação e entrega o controle ao nosso código.

Para este projeto, `mode=api` é o que queremos, porque a interface é nossa e os ajustes visuais são locais (seção 7.4). Mas o provisionamento por token foi descrito pelo fornecedor no formato simples. **Verifique em T0.4 se `mode=api` funciona com o token**; se não funcionar, consulte `suporte@rybena.com.br` antes de mudar o código. Note que o teste em `tests/run.ts` rejeita explicitamente `mode=full`, então essa decisão está congelada na suíte e precisaria ser revista junto.

---

## 5. Fase 0 — Desbloqueio

Sem esta fase, o chat da Fase 2 nasce conversando com um 500.

### T0.0 — Corrigir o `.vercelignore` (bloqueia todas as demais)

**Arquivo:** `.vercelignore`

**Execute esta tarefa antes de qualquer outra.** Enquanto as funções não carregarem, nenhum diagnóstico de credencial, Gemini ou Rybená tem valor: o processo morre antes de ler o ambiente. Veja a seção 4.0 para a medição completa.

**Correção:** acrescentar as duas negações que faltam.

```text
*
!app/
!app/**
!api/
!api/**
!vercel.json
!package.json
!tsconfig.json
```

`package.json` carrega o `"type": "module"` que mantém wrappers de `api/` e handlers de `app/` na mesma fronteira ESM. `tsconfig.json` dá resolução `Bundler` às funções, impedindo que a Vercel aplique `NodeNext` aos imports internos.

**Aceite — verifique nesta ordem, após o deploy:**

```bash
B=https://mvp-site-acessibilidade-clickbus-lovat.vercel.app
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' "$B/api/accessibility/plan"
```

1. `GET /api/accessibility/plan` deve devolver **`405 application/json`**, não 500. Isso prova que o nosso handler está executando.
2. `GET /api/accessibility/rybena` deve devolver `503` ou `200 application/json`, nunca 500.
3. `POST /api/accessibility/plan` sem header `Origin` deve devolver `403 application/json`.
4. Nenhuma resposta deve trazer `X-Vercel-Error`.

**Se ainda der 500 depois disso**, a causa era outra. Próximos passos de investigação, em ordem: (a) obter o log de runtime na Vercel, que mostra a exceção exata de carga do módulo; (b) verificar se a resolução do import `../../app/server/accessibility/handler.js` sobrevive ao empacotamento das funções. **Não** parta para tentativa e erro sem antes ler o log.

**Risco:** baixo na edição, alto no impacto. É uma mudança de duas linhas que desbloqueia todo o resto.

#### 5.1 Resultado: PASS, verificado em produção em 19/09/2026

Aplicada no commit `17d9948` e confirmada no domínio autorizado após o deploy:

```text
GET  /api/accessibility/plan                 405 application/json   (antes: 500 text/plain)
GET  /api/accessibility/rybena               200 application/json
POST /api/accessibility/plan sem Origin      403 application/json
POST /api/accessibility/plan origem alheia   403 application/json
POST /api/accessibility/plan text/plain      415 application/json
X-Vercel-Error                               ausente em todas
```

A hipótese da seção 4.0 se confirmou: o `package.json` da raiz era mesmo o que faltava. As quatro funções executam o nosso código, e o endpoint da Rybená passou a servir a URL do CDN com 200.

**Armadilha de diagnóstico observada.** Na primeira sondagem após o push, `rybena` já respondia 200 enquanto `plan` ainda devolvia 500 — o deploy estava propagando e as duas funções serviam versões diferentes. Isso quase levou à conclusão errada de que a cadeia de imports para `app/src/` era um segundo defeito. **Espere a propagação terminar e sonde todas as rotas antes de concluir qualquer coisa** a partir de resultados divergentes entre funções.

**Estado imediatamente após T0.0:** o Gemini passou a responder `503 "O provedor de IA ainda não foi configurado"` com payload válido, que é o caminho de falha honesta correto, porque nenhuma das três variáveis `ACCESSIBILITY_LLM_*` existe no projeto. Esse é o próximo bloqueio, tratado em T0.2.

**Nota de escopo:** ao listar os projetos da Vercel em 19/09/2026 apareceu **apenas** `mvp-site-acessibilidade-clickbus`. O segundo projeto (`-5xk5`) mencionado no `AGENTS.md` não consta mais. Confirme com o responsável e atualize a pendência correspondente.

### T0.1 — Corrigir o enum `thinkingLevel`

**Arquivos:** `app/server/accessibility/provider.ts`, `app/src/features/accessibility-agent/tests/run.ts`

**Passos:**

1. Trocar `thinkingLevel: 'low'` por `thinkingLevel: 'LOW'`.
2. Reavaliar o gate `useLowThinking`. Hoje é ligado por `model === 'gemini-flash-latest' || /^gemini-3(?:[.-]|$)/.test(model)`. Como o alias pode resolver para um modelo pré-Gemini 3 — caso em que o campo causa erro — remova `gemini-flash-latest` do gate e mantenha apenas a família Gemini 3 explícita. Alternativa aceitável: manter o alias no gate **somente** se T0.2 comprovar, com chamada real, que ele aceita o campo.
3. Atualizar a asserção do teste para o valor novo e acrescentar um caso que prove que um modelo fora da família Gemini 3 **não** recebe `thinkingConfig`.

**Aceite:** suíte passa; a asserção reflete o enum documentado; existe teste cobrindo a ausência do campo para modelos não-Gemini 3.

**Risco:** baixo. Mas o teste sozinho não prova nada — só T0.2 fecha este item.

### T0.2 — Credenciais locais e smoke real do Gemini

**Arquivos:** `docs/guides/08-DEPLOY-VERCEL.md`, `.gitignore` (verificar), `AGENTS.md` (seção 12)

O `.gitignore` já cobre `.env`, `.env.*`, `app/.env` e `app/.env.*`. **Confirme** antes de criar qualquer arquivo.

**Passos:**

1. Orientar o responsável a criar um `.env` **não versionado** na raiz com as três variáveis. O valor da chave nunca entra em documentação, commit, log ou evidência.
2. Confirmar que o servidor de desenvolvimento lê essas variáveis. O middleware de `app/vite.config.ts` chama os mesmos handlers de `app/server/accessibility/`, que leem `process.env` — valide que o Vite carrega o `.env` da raiz ou ajuste o carregamento. Não invente um mecanismo novo sem verificar.
3. Executar o smoke real com origem same-origin:

```bash
curl -s -X POST http://127.0.0.1:4173/api/accessibility/explain \
  -H 'content-type: application/json' \
  -H 'Origin: http://127.0.0.1:4173' \
  -d '{"contractVersion":"2.0","requestId":"smoke-1","term":"embarque","context":"Compare horarios e embarque antes de escolher.","contentRef":"results-help"}'
```

4. Repetir para `/plan` com um `PlannerRequest` válido e para `/simplify`.
5. Registrar em `docs/accessibility-agent/VALIDATION.md`: modelo efetivamente usado, se `thinkingConfig` foi aceito, latência e se a resposta passou no `plannerResponseSchema`.

**Aceite:** os três endpoints retornam 200 com corpo dentro do contrato, usando chave real. Nenhum segredo aparece em arquivo versionado, log ou evidência.

**Risco:** médio. Se a resposta cair no 502 "fora do contrato seguro", o problema é o prompt ou o schema, não a conectividade — diagnostique antes de afrouxar o contrato. **Nunca afrouxe o contrato para fazer um teste passar.**

#### 5.2 Resultado: PASS em produção, com ressalva de disponibilidade

Em 19/09/2026, contra o domínio autorizado com `gemini-3.8-flash`, **duas chamadas retornaram 200 com corpo aprovado pelo `textResponseSchema`**. Isso prova, com chamada real e não com transporte falso: o `thinkingLevel: 'LOW'` é aceito, o `responseJsonSchema` real é aceito, 4.096 tokens bastam, e a resposta cabe no contrato.

A ressalva é disponibilidade. Em 10 chamadas: 2 sucessos, 3 × HTTP 503 e 5 × HTTP 429 do provedor. Daí veio o retry único de 503/429 descrito na seção 3 do `AGENTS.md`.

#### 5.3 Escolha de modelo: três lições caras

1. **Aparecer em `models.list` não prova que o modelo serve.** `gemini-2.5-flash` está listado com `generateContent` entre os métodos suportados e mesmo assim devolve **404** em `:generateContent`. Modelo catalogado pode estar aposentado para atendimento.
2. **"Maduro" não é sinônimo de "disponível".** A troca de `gemini-3.8-flash` para `gemini-2.5-flash` foi feita supondo que um modelo mais antigo estaria menos saturado. Trocou-se instabilidade por indisponibilidade total.
3. **404 prova que a chave está certa.** A API do Google valida autenticação **antes** do caminho: chave inválida devolve `400 API_KEY_INVALID`. Portanto um 404 significa credencial aceita e modelo inexistente naquele caminho. Use isso para não caçar problema de chave à toa.

**Regra derivada, obrigatória:** depois de qualquer troca de `ACCESSIBILITY_LLM_MODEL`, rode um smoke real antes de confiar no modelo. Nunca troque o modelo na véspera da apresentação sem smoke.

Disponibilidade medida em 19/09/2026, mesmo endpoint, mesma chave:

| Modelo | Resultado |
|---|---|
| `gemini-3.5-flash` | **4 de 4** — em uso |
| `gemini-3.8-flash` | 2 de 10 (3 × 503, 5 × 429) |
| `gemini-2.5-flash` | 0 de 6 — sempre 404 |

#### 5.4 Qualidade semântica: `PARCIAL`, e há uma tarefa nova aqui

Nas mesmas 4 chamadas bem-sucedidas, explicando o termo "embarque": duas respostas corretas, uma vaga e **uma factualmente errada** — afirmou que "o embarque está diretamente relacionado ao ato de comparar horários", que é o contexto, não o termo.

A sonda usou um contexto propositalmente pobre, então o resultado não é conclusivo. Mas o padrão aponta para o `EXPLAIN_SYSTEM_PROMPT`, que instrui *"usando somente o contexto fornecido"*. Para um glossário isso é forte demais: o contexto deve **desambiguar** o termo, não ser a única fonte do significado. O modelo, obediente, descreve o contexto quando ele é magro.

**T1.8 (nova, pequena) — revisar os prompts de explicação e simplificação.**
Arquivo: `app/server/accessibility/prompt.ts`. Reescrever `EXPLAIN_SYSTEM_PROMPT` para que o contexto sirva de desambiguação e não de fonte única, preservando as proibições já existentes (nada de aconselhamento jurídico, financeiro ou médico). Depois, avaliar com pelo menos 5 termos reais do glossário e contextos verdadeiros da página, comparando com a explicação determinística que já existe em `core/glossary.ts`. Aceite: nenhuma resposta factualmente errada na amostra, com revisão humana registrada em `VALIDATION.md`.

Até isso acontecer, **não** apresente a explicação por IA como recurso confiável. O glossário determinístico local continua sendo o caminho seguro.

**Pendência a registrar:** fixar um modelo estável para a apresentação ou documentar explicitamente que `gemini-flash-latest` é alias mutável. Antes de habilitar chamadas pagas em hospedagem pública, configurar quota e budget no Google e rate limit persistente ou WAF na Vercel — a quota por instância do handler é apenas defesa em profundidade e não sobrevive ao escalonamento de funções stateless.

### T0.3 — Adaptador Libras de desenvolvimento

**Arquivo novo:** `app/src/features/accessibility-agent/adapters/libras/rybenaDevelopment.ts`
**Arquivos tocados:** o ponto onde o adaptador é escolhido, e `app/src/features/accessibility-agent/tests/run.ts`

O port `LibrasAdapter` (`adapters/libras/contracts.ts`) já isola tudo: `getSnapshot`, `initialize`, `open`, `close`, `translate`, `pause`, `resume`, `stop`, `setSpeed`, `subscribe`. Existem duas implementações hoje: `rybenaBrowser.ts` e `rybenaUnavailable.ts`.

**Passos:**

1. Criar uma terceira implementação que percorre a máquina de estados real (`idle → loading → ready → translating → paused`) **sem nenhuma rede**, com atrasos curtos e determinísticos.
2. Selecioná-la apenas em desenvolvimento, por flag explícita — `import.meta.env.DEV` combinado com uma variável de ativação. **A flag não pode ser um segredo** e o adaptador falso **nunca** pode ser selecionado em produção.
3. Exibir aviso visível e permanente na interface enquanto o adaptador falso estiver ativo, com texto do tipo "Simulação de Libras — ambiente de desenvolvimento". Isso protege a regra 4 da seção 3: ninguém pode confundir simulação com tradução real.
4. Cobrir no teste: transições de estado, idempotência e o fato de que o adaptador falso **não** é escolhido fora de desenvolvimento.

**Aceite:** com a flag ligada em dev, o painel percorre abrir → traduzir → pausar → retomar → parar → fechar sem rede; o aviso de simulação aparece; em build de produção o adaptador falso é inalcançável.

**Risco:** alto se malfeito. Um adaptador falso que vaze para produção vira alegação falsa de tradução em Libras. Trate a seleção do adaptador como código de segurança.

#### 5.5 Resultado de T0.3: PASS em 19/09/2026

Arquivos novos: `adapters/libras/rybenaDevelopment.ts` (o double) e
`adapters/libras/selection.ts` (a escolha). O port ganhou
`LibrasSnapshot.simulated`, que é o que obriga a interface a avisar.

**Como ligar em desenvolvimento** — a flag não é segredo e nunca carrega
credencial:

```bash
VITE_A11Y_LIBRAS_SIMULATION=on npx --yes pnpm@10.28.0 --dir app dev
```

No PowerShell, `$env:VITE_A11Y_LIBRAS_SIMULATION='on'` antes do comando, ou um
`app/.env.local` com a mesma linha — esse caminho já está no `.gitignore`.

**Duas barreiras independentes contra vazamento para produção.** A primeira é a
dobra estática: `import.meta.env.DEV` aparece literalmente no ternário de
`selection.ts`, então o empacotador o substitui por `false`, dobra o `&&` e
remove a referência à classe. A segunda é `shouldSimulateLibras`, função pura
que exige o valor exato `on` além de desenvolvimento, e que os testes cobrem.
**Não extraia `import.meta.env.DEV` para dentro da função:** isso quebra a dobra
e o adaptador falso volta a ser empacotado.

Verificação do bundle de produção após `build` limpo, por busca literal em
`app/dist/assets/index-*.js`:

| Marcador | No bundle |
|---|---|
| `RybenaDevelopment` | ausente |
| `Player simulado`, `Simulação pausada`, `Simulação interrompida` | ausentes |
| `Carregando a simulação`, `Velocidade da simulação` | ausentes |
| `nenhuma tradução real`, `percorrendo o trecho` | ausentes |
| `Simulação de Libras — ambiente de desenvolvimento` | **presente** |

A última linha é honesta e esperada: é apenas o rótulo do aviso, que mora em
`adapters/libras/contracts.ts` porque a interface precisa dele para renderizar.
A classe do adaptador falso não está no bundle, e em produção `simulated` é
sempre `false`, então o aviso nunca é renderizado — confirmado no preview da
build, onde `.a11y-simulation-notice` não existe no DOM.

**Exercício no navegador**, com a flag ligada em `127.0.0.1:4173`, painel aberto
na aba Conteúdo:

```text
painel aberto -> "Simulação de Libras — ambiente de desenvolvimento. Nenhuma tradução real será executada."
traduzir      -> "…: percorrendo o trecho selecionado."      (state = translating)
pausar        -> "Simulação pausada."                        (state = paused)
retomar       -> "Simulação retomada."                       (state = translating)
parar         -> "Simulação interrompida."                   (state = ready)
fechar        -> "Player simulado de Libras fechado."
```

Nenhuma requisição a `cdn.rybena.com.br` e nenhuma chamada a
`GET /api/accessibility/rybena` foram emitidas — medido com `PerformanceObserver`
sobre `resource`. As únicas URLs com "rybena" observadas são os próprios módulos
servidos pelo Vite em desenvolvimento.

O aviso permanente aparece logo abaixo do cabeçalho do painel, visível em todas
as superfícies, e o crédito do double diz **"Simulação local — nenhuma tradução
real foi executada"**. O crédito "Tradução em Libras por Rybená" continua sendo
exibido pelo adaptador real, que é o único que pode reivindicá-lo.

**Limite honesto:** isto é ferramenta de desenvolvimento. Não prova nada sobre a
Rybená, sobre o token, sobre `mode=api` ou sobre qualidade linguística. T0.4
continua sendo a única forma de validar a integração real.

Cobertura acrescentada em `tests/run.ts` (4 testes, suíte foi de 27 para 31):
máquina de estados completa sem rede, idempotência e transições impossíveis,
`shouldSimulateLibras` fora de desenvolvimento, e o fato de que só o double se
declara `simulated`.

### T0.4 — Deploy e smoke real da Rybená

**Pré-requisitos:** T0.0 e T0.3 concluídas, e **autorização explícita do responsável para fazer o deploy**. O domínio já está ativo na plataforma da Rybená e o token já foi emitido — ver seção 4.2.

**Passos:**

1. **Validar o formato do token antes de qualquer outra coisa**, com o comando de metadados da seção 4.2. Se `passaNoRegexAtual` for `false`, corrija o regex nos dois arquivos e no teste **antes** do deploy. Sem isso, o endpoint responderá 503 mesmo com o token correto configurado.
2. Configurar `RYBENA_ACCESS_TOKEN` **somente** no projeto e ambiente Vercel do domínio autorizado.
3. Fazer o deploy e validar no domínio autorizado, por navegador: `GET /api/accessibility/rybena` responde 200 apenas após ação explícita do usuário; a tag é injetada; os globals esperados aparecem; o player abre; a tradução ocorre em **ambos** os modos, Libras e voz.
4. Se o script carregar mas os globals não aparecerem, teste a hipótese `mode=api` da seção 4.2 antes de suspeitar do token.
4. Registrar evidência **sem** a URL tokenizada e **sem** o token. Recorte ou mascare a query string em qualquer captura.
5. Confirmar que o crédito "Tradução em Libras por Rybená" está visível.

**Aceite:** tradução real observada no domínio autorizado, com evidência registrada e sem vazamento de credencial.

**Risco:** alto para segredo. O token fica observável na URL do CDN dentro do navegador — exigência do fornecedor, já documentada — mas **não pode** ser versionado, embutido no bundle ou registrado em log. Remova ou rotacione a credencial ao expirar.

**Limite honesto:** qualidade linguística da tradução exige homologação com pessoas surdas sinalizantes. Um smoke técnico bem-sucedido **não** é homologação.

---

## 6. Fase 1 — Correções da auditoria

Independentes entre si; podem ser paralelizadas por agentes diferentes desde que cada um trabalhe em tarefa distinta.

### T1.1 — `aria-label` descartado em `<div>` (impacto: médio)

**Arquivos:** `app/src/features/results/ResultsPage.tsx`, componente da legenda de assentos

ARIA proíbe `aria-label` em elementos de role `generic`, e os navegadores **ignoram** o atributo. Hoje 14 rótulos são escritos e nunca chegam ao leitor de tela. Confirmado pela regra `aria-prohibited-attr` do axe: 13 nós em resultados e 1 na legenda de assentos.

Casos confirmados:

| Local | Rótulo perdido |
|---|---|
| `ResultsPage.tsx:136` | `Escolher data de ida` |
| `ResultsPage.tsx:155` | `Filtros ativos` |
| `ResultsPage.tsx:180` | `Saída 07:00, chegada 13:35` (um por card) |
| `ResultsPage.tsx:186` | `Comodidades` (um por card) |
| legenda de assentos | `Livre / Selecionado / Ocupado` |

O prejuízo real: em vez de "Saída 07:00, chegada 13:35", o leitor de tela anuncia só os números soltos, sem a semântica.

**Correção:** para cada caso, escolha **uma**:

- dar ao elemento um role que aceite nome — `role="group"` é o natural para os agrupamentos;
- mover a informação para um `<span>` visualmente oculto dentro do elemento;
- usar um elemento semântico que já aceite nome.

**Aceite:** `aria-prohibited-attr` sai do relatório do axe em resultados e assentos, **e** os rótulos passam a aparecer na árvore de acessibilidade. Verifique os dois — remover o atributo também zera a regra, e isso seria piorar.

### T1.2 — A filtragem dos resultados não é anunciada (impacto: médio-alto)

**Arquivo:** `app/src/features/results/ResultsPage.tsx`

Medição com `MutationObserver`: aplicar o filtro "Manhã (06h–11h59)" leva de 6 para 2 resultados produzindo **0 nós adicionados e 4 removidos**. O padrão de `aria-relevant` é `additions text`, então **remoções não são anunciadas**. E o contador que muda de "6 opções encontradas" para "2 opções encontradas" (linha 147) está **fora** de qualquer região viva.

Resultado: a pessoa filtra e não ouve absolutamente nada. A região viva está no container errado (linha 171) e, quando resultados são adicionados, produz anúncios fragmentados de pedaços de card.

**Correção:**

1. Remover `aria-live="polite"` de `<section className="trip-list">`, mantendo o `aria-label`.
2. Transformar o parágrafo do contador em região de status: `role="status"` e `aria-atomic="true"`.
3. Garantir que o texto anunciado seja curto e completo, do tipo "2 opções encontradas para 25 de setembro".
4. Confirmar que o estado vazio ("Nenhuma viagem encontrada") continua sendo anunciado.

**Aceite:** alterar ordenação ou filtro produz **um** anúncio curto com a contagem. Reproduza a medição com `MutationObserver` e registre o antes e o depois.

### T1.3 — `.vercelignore` — **promovida para T0.0**

Esta tarefa foi reclassificada. A sondagem do site publicado em 19/09/2026 mostrou que não se trata de um risco potencial de deploy, e sim da **causa raiz das funções quebradas em produção**. O conteúdo está agora em **T0.0**, no topo da Fase 0, e bloqueia todas as demais tarefas.

**Observação preservada:** os finais de linha do arquivo commitado são LF e estão corretos. O `^M` que aparece na cópia de trabalho é do checkout no Windows e não é problema.

### T1.4 — Remover o diretório morto `app/api/`

**Arquivos:** `app/api/accessibility/{explain,plan,rybena,simplify}.ts`

Os quatro arquivos duplicam `api/accessibility/`. Não são cobertos por nenhum `tsconfig` — os `include` do projeto são `api/**/*.ts`, `src` e `vite.config.ts` — não são referenciados em lugar nenhum do repositório, e não entram no deploy, já que `vercel.json` declara funções apenas em `api/accessibility/*.ts`.

Pior: eles preservam o import **sem** a extensão `.js`, que é justamente o padrão corrigido pelos commits `166a705` e `e8da138` nos arquivos canônicos. Quem editar ali não verá efeito nenhum e pode concluir que a correção não funciona.

**Correção:** remover o diretório e conferir que `AGENTS.md` seção 4 não o liste mais como estrutura ativa.

**Aceite:** `typecheck`, `build`, suíte e typecheck de `api/` continuam passando após a remoção.

### T1.5 — Atualizar o snapshot do `AGENTS.md`

**Arquivo:** `AGENTS.md`, seções 3 e 12

A seção 3 declara `HEAD: d0777cc` e "working tree contém a implementação local ainda não commitada". O `HEAD` real é `e8da138`, cinco commits à frente, com árvore limpa e sincronizada. A regra 10 do próprio arquivo exige essa atualização.

**Correção:** reescrever a seção 3 com o estado real e incorporar os resultados verificados da seção 2 deste documento. Atualizar a seção 12 conforme as pendências forem fechadas pelas Fases 0 a 3.

**Aceite:** nenhuma afirmação da seção 3 contradiz `git log`, `git status` ou o resultado das validações.

### T1.6 — Foco que não dependa de `requestAnimationFrame`

**Arquivos:** as 13 chamadas listadas abaixo

Todo o gerenciamento de foco do produto está dentro de callbacks de `requestAnimationFrame`:

```text
app/src/app/App.tsx:51
app/src/components/accessibility/AccessibilityPlugin.tsx:38,66,73,83,88
app/src/components/ui/Dialog.tsx:21,48
app/src/features/accessibility-agent/ui/AccessibilityPanel.tsx:151,164
app/src/features/accessibility-agent/ui/ContentTools.tsx:85
app/src/features/checkout/CheckoutPage.tsx:80
app/src/features/search/SearchPage.tsx:39
```

A lógica está correta, mas a entrega depende de o quadro ser pintado. Reproduzido na auditoria: com a página não composta, `document.visibilityState` continuava `"visible"` e `document.hasFocus()` continuava `true`, mas o `rAF` não disparou em 2,5 s — e nesse estado o foco não foi para a aba ao abrir o painel nem voltou ao acionador no Escape, ficando em `BODY`. Atinge aba em segundo plano e janela ocluída.

**Correção:** substituir por `setTimeout(fn, 0)` ou por um efeito de layout. Foco não precisa de alinhamento de quadro. Mantenha `rAF` apenas onde o alvo é de fato visual, como o `scrollTo` de `AccessibilityPanel.tsx:151`.

**Aceite:** abrir o painel, fechar com Escape e submeter o formulário com erro movem o foco corretamente mesmo com a aba em segundo plano. Teste com a aba oculta, não só em primeiro plano.

### T1.7 — Correções menores agrupadas

1. **`Map` de recibos sem limite** — `app/src/features/accessibility-agent/core/executor.ts:51` acumula um recibo por `planId` pela sessão inteira. Limite o tamanho, com descarte do mais antigo, preservando a idempotência para planos recentes.
2. **Mensagem de 503 enganosa** — este item deixou de ser cosmético. Em `provider.ts:192`, um provedor **mal configurado** cai no `catch` e vira "ainda não foi configurado". O mesmo padrão existe em `rybena.ts:38`: um token **presente mas rejeitado pelo regex** produz exatamente a mesma mensagem de "não configurada". Nos dois casos o responsável perde tempo procurando uma variável de ambiente que já está correta. Diferencie "não configurado" de "configuração inválida" **sem** revelar valores de configuração na resposta ao cliente — basta variar a mensagem e registrar a distinção do lado do servidor.
3. **`autocomplete` inconsistente** — em `CheckoutPage.tsx`, nome e CPF usam `autocomplete="off"` e a data de nascimento não tem o atributo. O `off` conflita com o SC 1.3.5 (Identify Input Purpose), mas é defensável num protótipo que proíbe dados reais e pede confirmação explícita de dados fictícios. **Decisão:** manter `off`, aplicar também na data de nascimento para ficar consistente, e registrar o trade-off em `docs/accessibility-agent/VALIDATION.md` como desvio consciente e justificado.

---

## 7. Fase 2 — Nova experiência do plugin

### 7.1 Referência visual e o que dela se aproveita

A referência são as capturas do portal do Bradesco fornecidas pelo responsável: um acionador circular fixo com o pictograma universal de acessibilidade, que abre um painel com **grade de cartões de recurso** (WebLibras, Voz, Mais Ferramentas, Sobre Acessibilidade) e uma ação em destaque na base.

**O que muda em relação à referência:** no lugar do botão "Atendimento em Libras", entra um **chat compacto** com ditado por voz. O chat é a porta de entrada do assistente: interpreta o pedido em linguagem natural e ou aplica ferramentas de adaptação visual, ou aciona Libras e voz.

**Aviso de propriedade intelectual:** inspire-se no *padrão de interação* — acionador circular, grade de cartões, painel ancorado. **Não copie** a identidade visual do Bradesco: nem a paleta magenta e vermelha, nem os ícones, nem os textos. Use os tokens de `app/src/styles/tokens.css` e os ícones Lucide já presentes no projeto, como manda a seção 6 do `AGENTS.md`.

### 7.2 O que já existe e deve ser reaproveitado

Não reescreva o núcleo. Hoje o painel (`app/src/features/accessibility-agent/ui/AccessibilityPanel.tsx`) tem três abas — `conversation`, `settings`, `content` — e o chat já vive na primeira, com `useVoiceInput` para ditado.

Reaproveite integralmente:

- `core/contracts.ts` — esquemas e contrato 2.0;
- `core/executor.ts` — revalidação e idempotência;
- `core/plannerClient.ts` — chamadas aos endpoints;
- `core/preferences.ts` — preferências canônicas v3 e migração;
- `ui/PreferenceControls.tsx` — os controles já são acessíveis e foram auditados;
- `ui/ContentTools.tsx` — glossário e simplificação;
- `ui/useVoiceInput.ts` — ditado por voz.

A tarefa é **trocar a casca de navegação**, não o motor.

### 7.3 A ambiguidade de "voz" — leia antes de codar

Existem duas coisas diferentes chamadas de voz, e confundi-las vai gerar retrabalho:

| | Origem | Existe hoje no código? |
|---|---|---|
| **Voz de entrada** (ditado) | Web Speech API do navegador, em `useVoiceInput.ts` | Sim |
| **Voz de saída** (narração do conteúdo) | Rybená, método `switchToVoz()` | **Não** |

O cartão "Voz" da referência é **saída** — narração do conteúdo da página.

**Verificado na documentação oficial em 19/09/2026:** o método existe e é `RybenaApi.getInstance().switchToVoz()`. A superfície documentada de tradução é:

```text
translate(text)   switchToLibras()   switchToVoz()
play()   pause()   stop()   setSpeed()
openPlayer()   handleLoaded()   handleTranslate()
```

**Isso corrige uma suposição de arquitetura.** Libras e voz **não** são dois serviços independentes: são **dois modos do mesmo player**, compartilhando `translate`, `play`, `pause`, `stop` e `setSpeed`. Criar um port separado para voz lutaria contra o modelo do fornecedor e duplicaria o ciclo de vida. O caminho certo é **estender o adaptador existente com troca de modo**.

### 7.4 Sobreposição entre a Rybená e os ajustes visuais locais — decisão obrigatória

A API da Rybená **também** oferece os mesmos ajustes visuais que o projeto já implementa localmente:

| Recurso local do projeto | Equivalente na Rybená |
|---|---|
| entrelinha | `toggleLineHeight()` |
| espaçamento entre letras | `toggleLetterSpacing()` |
| escala de texto | `toggleZoom()`, `nextZoom()`, `previousZoom()` |
| alto contraste | `toggleDarkContrast()`, `toggleLightContrast()`, `toggleInvertedContrast()` |
| cursor grande | `toggleCursorSize()`, `toggleAmplifyCursor()` |
| destacar links | `toggleLinkHighlight()` |
| destacar títulos | `toggleTitleHighlight()` |
| máscara de leitura | `toggleReadingMask()` |
| guia de leitura | `toggleCursorGuide()` |
| movimento reduzido | `togglePauseAnimations()` |
| glossário | `toggleDictionary()` |

**Decisão adotada:** os ajustes visuais continuam sendo **responsabilidade exclusiva do executor local**. A Rybená é usada **somente** para Libras e voz.

Justificativa: a implementação local já passou na auditoria, funciona sem rede, persiste em `clickbus-a11y-v3` com migração de versões, e não depende de um token temporário. Delegar à Rybená perderia tudo isso.

**Regra derivada, de cumprimento obrigatório:** o executor **nunca** chama os métodos visuais da Rybená. Se ambos aplicarem contraste ou zoom ao mesmo tempo, os efeitos se somam e o resultado fica quebrado — zoom duplo, filtros de contraste em conflito. Ao carregar o script, avalie usar `disableAccessibilityButton=true` para que a barra do fornecedor não ofereça ao usuário controles que colidem com os nossos.

### 7.5 Especificação da nova navegação

Hoje o painel é um `tablist` de três abas: `conversation`, `settings`, `content`. O alvo é **lançador + superfície**, que é o padrão da referência.

```text
acionador circular (host lateral fixo, fora do Header)
└── painel
    ├── superfície RAIZ: grade de cartões
    │   ├── Libras            -> superfície Libras
    │   ├── Voz               -> superfície Voz
    │   ├── Ajustes visuais   -> PreferenceControls (já existe, já auditado)
    │   ├── Conteúdo          -> ContentTools (já existe, já auditado)
    │   └── Sobre             -> texto estático, limites e créditos
    └── faixa fixa na base: chat assistente + ditado
```

**Modelo de estado.** Uma superfície ativa por vez, com `raiz` como padrão. Toda superfície que não é a raiz precisa de um controle "Voltar" como **primeiro** elemento focável. Abrir o painel sempre começa na raiz — não restaure a última superfície, porque a pessoa pode ter mudado de página entre uma abertura e outra.

**O que acontece com as abas.** O `tablist` sai. Isso **remove** a navegação por setas que `handleTabKeyDown` implementa hoje; a grade passa a ser percorrida por `Tab`, o que é correto para uma grade de botões. Não recrie `role="tab"` em cartões: cartão que navega para outra superfície é `<button>`, não aba.

**O chat fica sempre visível**, na base, em todas as superfícies. Ele é a porta de entrada do assistente e ocupa o lugar que na referência é do botão "Atendimento em Libras". Em 320 px isso compete por espaço: colapse o chat para uma linha com o campo e o botão de envio, nunca o esconda atrás de outro clique.

**Não regrida nada desta lista** — tudo já passa na auditoria hoje:

| Invariante | Onde se prova |
|---|---|
| switches nomeados por `aria-labelledby` | axe, painel aberto |
| segmentados em `role="group"` com `aria-label` | axe, painel aberto |
| modal com backdrop e body travado em ≤ 820 px | teste de breakpoint |
| região não modal e página rolável em ≥ 821 px | teste de breakpoint |
| Escape fecha e devolve foco ao acionador | teclado |
| armadilha de foco apenas no modo modal | teclado |
| 0 px de overflow em 320 px com texto a 150% | reflow |
| 0 violações axe | varredura antes e depois |

O jeito de não regredir é mecânico: **rode o axe com o painel aberto antes de começar, guarde o resultado, e compare ao terminar.** Contagem de `passes` que cai é sinal de que algo deixou de ser exposto.

### T2.1 — Acionador circular e grade de recursos

**Arquivos:** `app/src/components/accessibility/AccessibilityPlugin.tsx`, `app/src/styles/accessibility-plugin.css`

**Passos:**

1. Substituir o acionador lateral atual por um botão circular fixo com o pictograma de acessibilidade. Preserve o que já funciona: `aria-expanded`, `aria-controls`, o rótulo dinâmico com a contagem de ajustes ativos e o `ref` para retorno de foco.
2. Construir a grade de cartões como primeira superfície do painel. Cartões sugeridos, alinhados ao que o produto realmente faz: **Libras**, **Voz**, **Ajustes visuais**, **Conteúdo** (glossário e simplificação) e **Sobre acessibilidade**.
3. Cada cartão é um `<button>` que navega para sua superfície dentro do painel. Cada superfície precisa de caminho de volta para a grade, alcançável por teclado.
4. Manter rigorosamente as invariantes já auditadas: modal com backdrop e body travado em ≤ 820 px; região não modal e página rolável em ≥ 821 px; Escape fecha e devolve o foco ao acionador; armadilha de foco apenas no modo modal.

**Aceite:** axe sem violações com o painel aberto nos dois breakpoints; navegação completa por teclado da grade a cada superfície e de volta; reflow sem overflow em 320 px com texto a 150%.

**Risco:** alto de regressão. O painel atual **passa** na auditoria — switches nomeados por `aria-labelledby`, segmentados em `role="group"` com `aria-label`. Não perca isso ao reorganizar. Rode o axe antes e depois e compare.

### T2.2 — Chat assistente com ditado por voz

**Arquivos:** superfície nova sob `ui/`, reaproveitando o que hoje está na aba `conversation`

**Passos:**

1. Posicionar o chat como ação em destaque na base da grade, ocupando o lugar que na referência é do botão "Atendimento em Libras".
2. Campo de texto com rótulo explícito, botão de envio e botão de ditado.
3. O ditado só começa após ação explícita, a transcrição é editável antes do envio, e `abort()` é chamado ao fechar o painel — comportamento já implementado, preserve-o.
4. Histórico limitado a 6 turnos, respeitando o `plannerRequestSchema`, que rejeita mais que isso.
5. Estados honestos e visíveis: enviando, indisponível (503), limite atingido (429), erro (502). O texto de indisponibilidade deve dizer que os ajustes manuais continuam funcionando.
6. Região de status para anunciar a resposta do assistente. Use `role="status"`, com mensagem curta e atômica.

**Aceite:** chat operante por teclado e por leitor de tela; os quatro estados de erro renderizam mensagem compreensível em português; ditado não inicia sozinho; axe sem violações.

### T2.3 — Capacidade de voz no contrato e no executor

**Arquivos:** `core/contracts.ts`, `core/executor.ts`, `adapters/libras/*`, `server/accessibility/prompt.ts`, `tests/run.ts`

**Pré-requisito:** nenhum. A API de voz já foi confirmada na documentação oficial — ver seção 7.3.

**Passos:**

1. Renomear o port de `LibrasAdapter` para algo neutro, como `RybenaAdapter`, e acrescentar `setMode('libras' | 'voz')`, mapeado para `switchToLibras()` e `switchToVoz()`. **Não** crie um port separado para voz: o fornecedor trata os dois como modos do mesmo player, e duplicar o ciclo de vida geraria dois players concorrentes.
2. Acrescentar `mode` ao `LibrasSnapshot`, para que a interface saiba qual modo está ativo e possa refletir isso nos cartões.
3. Estender o contrato com as ações de voz, no padrão das de Libras. Isso **muda o contrato**: incremente `CONTRACT_VERSION` e trate a migração, porque o executor compara `contractVersion` e rejeitaria planos fora do esperado.
4. Acrescentar as novas capacidades à lista enviada ao planejador e ao `PLANNER_SYSTEM_PROMPT`.
5. Atualizar o adaptador falso de T0.3 para cobrir os dois modos.
6. Cobrir no teste: ação de voz desconhecida rejeitada, capacidade indisponível rejeitada, troca de modo idempotente, e que **nenhum** método visual da Rybená é invocado pelo executor (seção 7.4).

**Aceite:** executor aceita as ações de voz apenas quando a capacidade está presente; contrato versionado; suíte cobre os novos caminhos.

**Risco:** alto. Mexer no contrato afeta planejador, executor e validação de servidor ao mesmo tempo. Faça em um commit isolado, com a suíte verde antes e depois.

### T2.4 — Roteamento do chat

**Arquivo:** a superfície de chat da T2.2

O chat precisa levar o pedido em linguagem natural a um de três destinos:

| Pedido | Destino | Estado |
|---|---|---|
| "aumenta a letra", "o site tá difícil de ler" | ferramentas visuais, via `set_preferences` / `apply_comfortable_reading` | funciona hoje |
| "quero em Libras" | adaptador Libras | fake em dev, real só no domínio autorizado |
| "lê isso pra mim" | adaptador de voz | depende da T2.3 |

**Passos:**

1. O roteamento é decidido **pelo plano devolvido pelo planejador**, não por heurística de string no cliente. O executor já revalida tudo.
2. Preservar os modos do contrato: `apply` aplica; `propose` pede confirmação; `clarify` pergunta; `unsupported` recusa com honestidade.
3. Para `propose`, renderizar a combinação proposta e exigir confirmação explícita antes de executar.
4. Sempre oferecer **desfazer** após aplicar — a transação de desfazer já existe em `preferences.ts`.
5. Quando a capacidade estiver indisponível — Rybená não configurada, por exemplo — a resposta deve dizer isso com clareza e **não** fingir que executou.

**Aceite:** os três caminhos funcionam de ponta a ponta em desenvolvimento; `propose` nunca aplica sem confirmação; indisponibilidade é comunicada honestamente; nenhum dado de checkout, passageiro ou pagamento é enviado ao planejador — confirme inspecionando a aba de rede.

---

### 7.6 Resultado da Fase 2: PASS em 19/09/2026

Executada por um único agente, na ordem T2.1 → T2.2 → T2.3 → T2.4, com
validação mínima a cada tarefa. A suíte foi de 31 para 35 testes.

#### Estrutura entregue

```text
acionador circular (60 px, pictograma de acessibilidade, host lateral fixo)
└── painel
    ├── cabeçalho + [aviso de simulação, quando ativo]
    ├── superfície rolável (uma por vez, `root` por padrão)
    │   ├── RAIZ: grade de 5 cartões + "Agora na página"
    │   │   Libras · Voz · Ajustes visuais · Conteúdo · Sobre acessibilidade
    │   └── demais: "Voltar aos recursos" + título + conteúdo reaproveitado
    └── faixa fixa na base: chat + ditado + estado + desfazer
```

Arquivos novos em `ui/`: `FeatureGrid.tsx`, `PlayerSurface.tsx`,
`AboutSurface.tsx`. `PreferenceControls.tsx`, `ContentTools.tsx` e
`useVoiceInput.ts` foram reaproveitados — a casca de navegação mudou, o motor
não. O bloco de Libras saiu de `ContentTools` para `PlayerSurface`, que serve
Libras e voz.

#### T2.1 — acionador e grade

O `tablist` saiu, como manda a seção 7.5. A grade é percorrida por `Tab`; cada
cartão é `<button>` com id estável `a11y-card-<superfície>`.

Modelo de foco, medido por teclado (só `Tab` e `Enter`, sem clique):

| Cartão | Abre | Foco ao entrar | Voltou à raiz | Foco ao voltar |
|---|---|---|---|---|
| `a11y-card-libras` | Libras | `a11y-back` | sim | `a11y-card-libras` |
| `a11y-card-voice` | Voz | `a11y-back` | sim | `a11y-card-voice` |
| `a11y-card-settings` | Ajustes visuais | `a11y-back` | sim | `a11y-card-settings` |
| `a11y-card-content` | Conteúdo | `a11y-back` | sim | `a11y-card-content` |
| `a11y-card-about` | Sobre acessibilidade | `a11y-back` | sim | `a11y-card-about` |

"Voltar" é o primeiro focável de toda superfície não raiz, e sair devolve o foco
ao cartão de origem. O chat continua visível nas cinco superfícies.

#### T2.2 — chat

Faixa fixa na base, com rótulo explícito, campo, botão de ditado e botão de
envio. Em 320 px colapsa para uma linha com campo e botões — nunca some atrás de
outro clique. O ditado só começa por ação explícita, a transcrição é editável
antes do envio e `abort()` continua acontecendo ao fechar o painel, porque o
painel desmonta.

A região de estado é `role="status"` com `aria-atomic="true"` e existe sempre no
DOM, vazia e sem caixa, para que o anúncio funcione. Estados medidos no
navegador, com o endpoint substituído por respostas controladas:

| Situação | Texto renderizado | Tom |
|---|---|---|
| enviando | "Analisando seu pedido com o planejador seguro…" | busy |
| 503 | "O planejamento por IA ainda não foi configurado neste ambiente. Os ajustes manuais continuam disponíveis." | warning |
| 429 nosso | "Muitos pedidos em pouco tempo. Aguarde um minuto — os ajustes manuais continuam disponíveis." | warning |
| 502 `provider_http_429` | "O serviço de IA está ocupado agora. Aguarde alguns segundos e peça novamente — os ajustes manuais continuam disponíveis." | warning |
| 502 genérico | mensagem do servidor + "Os ajustes manuais continuam disponíveis." | error |
| 200 fora do contrato | "A resposta do serviço não seguiu o contrato seguro e foi descartada. Os ajustes manuais continuam disponíveis." | error |

`AccessibilityServiceError` ganhou um campo `kind`, para a interface escolher o
texto e o tom sem reinterpretar mensagem de erro por substring.

#### T2.3 — contrato 2.1 e voz

O port foi renomeado de `LibrasAdapter` para `RybenaAdapter`, ganhou
`setMode('libras' | 'voz')` e `mode` no snapshot. **Não** existe port separado
para voz: o fornecedor trata os dois como modos do mesmo player, e duplicar o
ciclo de vida geraria dois players concorrentes.

`CONTRACT_VERSION` foi para `2.1`, com seis ações novas: `open_voice`,
`close_voice`, `speak_content`, `pause_voice`, `resume_voice`, `stop_voice`.

**Migração.** O contrato não tem artefato persistido — as preferências vivem em
`clickbus-a11y-v3`, versionadas à parte. Então migrar é rejeitar o que não é
desta versão, e isso acontece nas duas pontas. Medido contra o servidor local:

```text
POST /api/accessibility/plan  contractVersion 2.1  ->  503 (honesto: sem provedor)
POST /api/accessibility/plan  contractVersion 2.0  ->  400 (rejeitado no contrato)
```

O executor rejeita do mesmo jeito, então um plano 2.0 em voo é descartado em vez
de aplicado pela metade.

**Regra de modo no executor.** Entrada (`open_*`, `translate_content`,
`speak_content`) troca o modo antes de agir. Transporte (`pause_*`, `resume_*`,
`stop_*`) só age quando o player já está no modo pedido; caso contrário devolve
recusa honesta. Assim "pausa a narração" nunca pausa, em silêncio, uma tradução
em Libras. `close_*` vale para os dois modos.

**Seção 7.4, verificada por teste.** `RybenaAdapter` não declara nenhum método
visual da Rybená. O teste monta um runtime falso com os 16 métodos visuais
documentados (`toggleZoom`, `toggleDarkContrast`, `toggleReadingMask`…), executa
seis planos que mexem em preferências, Libras, voz e velocidade, e afirma que a
lista de métodos visuais tocados é vazia.

#### T2.4 — roteamento

O destino vem das **ações do plano**, não de heurística de string no cliente. O
executor revalida esquema, capacidades, página, sessão, revisão e `planId` antes
de qualquer efeito. Medido ponta a ponta contra o servidor de desenvolvimento
com o adaptador simulado, substituindo apenas o planejador:

| Pedido | Plano devolvido | Resultado observado |
|---|---|---|
| visual | `apply` + `set_preferences` | `data-text-scale=1.25` aplicado, "Desfazer este ajuste" oferecido |
| visual vago | `propose` + `apply_comfortable_reading` | proposta renderizada; **nada aplicado** até confirmar; depois aplicado e desfazer oferecido |
| Libras | `apply` + `translate_content` | player simulado em modo Libras, estado `translating` |
| voz | `apply` + `speak_content` | player simulado em modo voz, estado `translating` |
| fora de escopo | `unsupported` | recusa honesta, nada aplicado |

**Indisponibilidade honesta**, medida na build de produção sem token da Rybená:
o plano pede `translate_content`, o adaptador real falha e a resposta é
"A Rybená ainda não foi configurada neste ambiente.", em tom de erro, sem oferta
de desfazer e sem fingir que executou.

**Exclusões, medidas inspecionando o corpo enviado.** No checkout, com nome, CPF
e data de nascimento preenchidos, o pedido ao planejador levou
`contentTargets: []`, **não** levou `translate_content` nem `speak_content` nas
capacidades, e o corpo não continha o nome, o CPF nem a data de nascimento. As
chaves do contexto são exatamente as do contrato.

#### O que caiu na contagem do axe, e por quê

`passes` caiu de 304 para 295 no total. A diferença inteira é de duas regras,
`aria-required-children` e `aria-required-parent`, e só nas execuções com o
painel aberto. Elas só tinham nós a examinar porque existia `role="tablist"`
com `role="tab"`. Removido o `tablist` — exigência da seção 7.5 —, as duas
regras ficam **inaplicáveis**, não reprovadas. Nenhuma regra passou de `pass`
para `violation` ou `incomplete`, e `scrollable-region-focusable` passou a
figurar entre as aprovadas em três execuções.

Comparação feita por identificador de regra, não por contagem: a linha de base
foi recapturada no `HEAD` `91b8f7d` com o mesmo script e o mesmo axe 4.10.2.

#### Três defeitos encontrados na revisão do PR e corrigidos

1. **O prompt do planejador ficou preso no contrato 2.0.** `CONTRACT_VERSION`
   subiu para 2.1, mas `PLANNER_SYSTEM_PROMPT` mandava, em texto, responder "no
   contrato 2.0 recebido". O enum de `responseJsonSchema` empurra 2.1, mas a
   instrução textual conflitante podia fazer o modelo emitir 2.0 — que o
   validador do servidor rejeita — ou brigar com o esquema. A versão passou a
   ser interpolada de `CONTRACT_VERSION`, e um teste novo falha se o prompt
   citar qualquer outra versão. A eficácia do teste foi conferida invertendo o
   prompt de propósito: ele acusou.

2. **Ver a superfície de Voz trocava o modo do player.** `PlayerSurface`
   chamava `setMode(mode)` na montagem. Reproduzido no navegador: com uma
   tradução em Libras em andamento, abrir o cartão Voz mudava o status para
   "Simulação em modo de voz." e **habilitava** "Pausar" e "Parar a narração"
   sobre o que era uma tradução; no adaptador real, `switchToVoz()` seria
   chamado no player em andamento. Pior, o executor decide a legitimidade de um
   transporte olhando `getSnapshot().mode`, então apenas visualizar a superfície
   furava esse guard. O `setMode` saiu da montagem — o modo agora muda só ao
   iniciar a reprodução — e a superfície do outro modo passa a exibir nota
   honesta: "O player está ocupado com uma tradução em Libras. Pedir a narração
   vai substituí-la." Verificado nos três momentos: traduzindo, ao abrir Voz
   (transporte desabilitado, nota visível) e ao iniciar a narração.

3. **O SDD ficou materialmente falso.** Como arquitetura normativa, ele ainda
   definia `LibrasAdapter` sem `setMode` nem voz, e afirmava que doubles de
   Libras ficam "exclusivamente em testes, nomeados `TestLibrasAdapter`".
   Quem seguisse o documento desfaria o desenho de player compartilhado ou
   removeria a seleção do adaptador de desenvolvimento. Atualizado com
   `RybenaAdapter`, a regra de quem pode trocar o modo, a proibição dos métodos
   visuais e as duas barreiras da seleção em produção.

**Defeito encontrado e corrigido na revisão da evidência.** O acionador
circular aparecia **sem pictograma** abaixo de 360 px: duas regras de
`components.css` escritas para o acionador antigo do `Header`
(`.accessibility-trigger > svg:last-child { display: none }` e
`.accessibility-trigger > span:not(.mode-count) { display: none }`) escondiam o
ícone do acionador novo. O elemento que elas miravam não existe mais, então as
duas foram removidas. O axe não pegaria isso: o botão tem `aria-label` e o ícone
é `aria-hidden`. Só apareceu ao revisar a captura de 320 px com o painel
**fechado** — as varreduras anteriores em 320 px tinham o painel aberto, estado
em que o acionador fica oculto por CSS. Verificado depois da correção em 1440,
821, 820, 480, 390, 360 e 320 px: ícone presente e com tamanho maior que zero em
todas.

**Correção menor aproveitada no caminho:** o rótulo do botão de fechar do painel
era idêntico ao do acionador ("Fechar acessibilidade"); passou a ser "Fechar o
painel de acessibilidade". E as seções internas das superfícies desceram de
`h3` para `h4`, porque o título da superfície agora ocupa o `h3` — a hierarquia
do painel é `h2` (painel) → `h3` (superfície) → `h4` (seção).

### 7.7 Revisão do padrão visual e portabilidade de recursos — 19/09/2026

Decisão do responsável depois de comparar com o portal de referência.

#### O acionador sai da lateral e vai para o header

Ele passa a ficar no fim da barra, com o pictograma universal de acessibilidade
e o rótulo "ACESSIBILIDADE", como na referência. O `Header` é
`position: sticky`, então a alcançabilidade não piora — **essa é a condição que
sustenta a mudança**. Se a barra deixar de ser sticky, o acionador precisa
voltar a ser fixo, ou a pessoa terá de rolar até o topo para achar os controles
de acessibilidade.

Mecanismo: o `AccessibilityPlugin` continua dono de todo o estado e projeta o
botão para `#accessibility-trigger-slot` com `createPortal`. Assim o estado do
painel não precisa subir para o `App`. Se o encaixe faltar, o botão é
renderizado no próprio host — um controle de acessibilidade não pode
simplesmente desaparecer por causa de um seletor que não casou.

**Isto revoga uma invariante do `AGENTS.md`**, que dizia que o acionador
pertence ao host fixo lateral, fora do `Header`. O documento foi atualizado.

#### A raiz fica mais enxuta

Grade 2×2 de cartões quadrados — Libras, Voz, Ajustes visuais, Conteúdo — com
"Sobre acessibilidade" como link abaixo. A referência usa um cartão "Mais
Ferramentas" que enterra o resto um nível mais fundo; 2×2 fica igualmente
simples e mais raso. O cartão mostra só o rótulo, e a descrição vai em
`aria-describedby`, então quem usa leitor de tela continua ouvindo o que cada
recurso faz antes de entrar.

O chat ganhou três chips de sugestão. Um campo vazio não comunica o que ele
aceita. Os chips **apenas preenchem** o campo — verificado no navegador:
clicar num chip deixa o campo com o texto e a região de estado vazia, sem
nenhuma chamada ao planejador.

**Propriedade intelectual.** O pictograma de acessibilidade é símbolo padrão e
foi copiado deliberadamente. A paleta, os ícones e os textos do portal de
referência **não** foram: valem os tokens de `tokens.css` e os ícones Lucide,
como manda a seção 7.1.

#### Recursos da Rybená portados para o executor local, não delegados

Surgiu a ideia de usar a LLM para acionar as ferramentas visuais da Rybená e
assim aproveitar a lista inteira do fornecedor. **Tecnicamente é possível** — a
LLM continuaria só planejando, e o executor é que chamaria os métodos. A
decisão foi **não delegar**, e a seção 7.4 continua valendo. Três razões:

1. **Os métodos visuais da Rybená são toggles, não valores.** `toggleZoom()`,
   `nextZoom()`, `toggleDarkContrast()`. Nosso contrato é declarativo —
   `set_preferences: { textScale: 1.25 }`. Com toggle não dá para exprimir
   "texto a 125%" sem conhecer o estado atual do fornecedor e calcular a
   diferença, e não há como ler esse estado com confiança. Quebra a idempotência
   por `planId`, o desfazer e o recibo "já estava nesse estado".
2. **O token é preso ao domínio e é temporário.** Os ajustes visuais hoje
   funcionam sem rede e em `localhost`. Delegando, parariam em desenvolvimento,
   parariam na rotação do token e cairiam junto com o fornecedor.
3. **Não reduz complexidade, troca complexidade própria por dependência.** O
   executor local já passou na auditoria. E como os efeitos somam, não é "usar
   os dois": é substituir.

**O que foi aproveitado da ideia:** a Rybená tem recursos que nós não tínhamos.
Três foram portados como preferências declarativas locais — **saturação**
(padrão, alta, baixa, tons de cinza), **correção de cores** (protanopia,
deuteranopia, tritanopia) e **fonte para dislexia**. Ficam offline, entram no
desfazer e o chat os comanda pelo mesmo contrato.

#### Preferências v4

As três chaves novas exigiram `clickbus-a11y-v4`, porque o leitor da v3 valida
a contagem exata de chaves e um registro antigo cairia no padrão, perdendo o
que a pessoa tinha salvo. A migração v3 → v4 preenche as novas com o padrão e
preserva o resto; coberta por teste que confere as treze chaves antigas uma a
uma. Medido no servidor local: um pedido com as dezesseis chaves responde `503`
honesto, e um pedido sem as três novas responde `400`.

**Armadilha registrada.** Saturação e correção de cores **não** podem usar
`filter` num ancestral: `filter` torna o elemento bloco de contenção para
descendentes `position: fixed`, e o painel, os diálogos de filtro e itinerário
e a máscara de leitura parariam de se posicionar pela viewport. O efeito vem de
`backdrop-filter` numa camada fixa em z-index 898, abaixo do painel (950), do
guia (900) e da máscara (899) — os controles de acessibilidade seguem legíveis.
Verificado nos seis estados, incluindo saturação e correção combinadas: o
painel continua ancorado, o botão da busca continua clicável e o overflow
permanece em 0 px.

#### Defeito de foco encontrado e corrigido

Tirar "Sobre acessibilidade" da grade quebrou o retorno de foco: ao voltar para
a raiz o foco caía no `body`, porque o seletor de retorno procura
`#a11y-card-<superfície>` e o link não tinha id. O link recebeu
`id="a11y-card-about"`, e as cinco entradas voltaram a devolver o foco à origem.

#### Validação desta rodada

| Verificação | Resultado |
|---|---|
| typecheck, build, suíte, typecheck de `api/` | **PASS** — 38 testes |
| axe em 5 telas e no painel em 1440, 821, 820, 390 e 320 px | **PASS** — 0 violações |
| reflow nos três tamanhos, painel aberto e fechado | **PASS** — 0 px |
| breakpoints 820/821 | **PASS** — diálogo modal vs. região |
| Escape, armadilha de foco, aba oculta sem `rAF` | **PASS** — acionador no header recebe o foco de volta |
| teclado da raiz a cada superfície e de volta | **PASS** — 5 entradas |
| chips preenchem sem enviar | **PASS** |
| chat aplica plano com preferência da v4 e oferece desfazer | **PASS** — `saturation` e `dyslexiaFont` chegam ao DOM |
| camada de filtro não quebra `fixed` nem intercepta ponteiro | **PASS** — 6 estados |
| guia e máscara, via v3 migrado e via v4 | **PASS** — `pointer-events: none` nas 4 camadas |
| jornada completa | **PASS** — 0 erro de console |
| endpoints 405/403/415/413/503 e recusa de preferências incompletas | **PASS** |

`passes` do axe: 304 na linha de base, 291 agora. A diferença continua sendo
inaplicabilidade, não reprovação: `aria-required-children` e
`aria-required-parent` saíram com o `tablist`, e `scrollable-region-focusable`
deixou de ter nó a examinar em 320 px com texto a 150%, porque a raiz 2×2 cabe
sem rolagem. Nenhuma regra passou de aprovada a violada, e as violações
seguem em zero.

## 8. Fase 3 — Validação e evidências

### T3.1 — Regressão integral

**Obrigatório antes de considerar o trabalho concluído.**

| Verificação | Como | Critério |
|---|---|---|
| Typecheck, build, suíte | comandos da seção 1 | tudo passa |
| Typecheck de `api/` | binário local | passa |
| Jornada completa | navegador | busca → confirmação sem erro de console |
| axe em 5 telas + painel aberto | axe-core 4.10.2, tags wcag2a/2aa/21a/21aa/22aa | 0 violações |
| Reflow | 1440×900, 390×844, 320×844 | 0 px de overflow |
| Reflow extremo | 320 px + texto 150% + alto contraste + painel aberto | 0 px de overflow |
| Breakpoint | 820 px e 821 px | modal vs. região, conforme invariante |
| Teclado | Tab, Shift+Tab, Escape, setas nas abas | foco visível, sem armadilha fora do modal |
| Foco em aba oculta | após T1.6 | foco move corretamente |
| Anúncio de filtragem | `MutationObserver` + contador | um anúncio curto com a contagem |
| Endpoints | curl | 403, 405, 415, 413, 429, 503 e 200 real |
| Exclusões | inspeção da rede | checkout e confirmação nunca vão ao planejador |
| Guia e máscara | ponteiro | não interceptam cliques |
| Console e rede | ao tocar IA, voz e Rybená | sem erro e sem vazamento de token |

### 8.1 Resultado de T3.1: 19/09/2026

Tudo abaixo foi medido nesta rodada, com a build de produção servida em
`127.0.0.1:4175` e, onde indicado, o servidor de desenvolvimento em `:4173` com
`VITE_A11Y_LIBRAS_SIMULATION=on`.

| Verificação | Resultado |
|---|---|
| `typecheck` do app | **PASS** |
| `build` | **PASS** |
| `test:accessibility` | **PASS** — 35 testes |
| `typecheck` de `api/` pelo binário local | **PASS** |
| Jornada completa busca → confirmação | **PASS** — 5 etapas, `scrollY = 0` e foco em `main#main-content` a cada troca |
| Console e exceções durante a jornada | **PASS** — 0 erros, 0 avisos, 0 exceções |
| axe em 5 telas | **PASS** — 0 violações |
| axe com o painel aberto, 5 larguras | **PASS** — 0 violações |
| Reflow 1440×900, 390×844, 320×844 | **PASS** — 0 px de overflow, painel aberto e fechado |
| Reflow extremo 320 px + texto 150% + alto contraste + painel | **PASS** — 0 px |
| Breakpoint 821 px | **PASS** — `role="region"`, sem `aria-modal`, sem backdrop, body rolável |
| Breakpoint 820 px | **PASS** — `role="dialog"`, `aria-modal="true"`, backdrop, `body.overflow = hidden` |
| Escape fecha e devolve foco ao acionador | **PASS** — desktop e mobile |
| Armadilha de foco só no modal | **PASS** — 30 `Tab` escapam em 1440 px, nenhum escapa em 390 px |
| Foco com aba oculta e `requestAnimationFrame` desligado | **PASS** — abre e devolve o foco corretamente |
| Teclado da grade a cada superfície e de volta | **PASS** — 5 superfícies |
| Anúncio de filtragem | **PASS** — 1 anúncio atômico, "2 opções encontradas para 26 de setembro." |
| Guia e máscara não interceptam ponteiro | **PASS** — `pointer-events: none` nas 4 camadas; `elementFromPoint` devolve o botão |
| Endpoints: 405, 403, 415, 413, 503 | **PASS** — todos `application/json` |
| Contrato antigo (2.0) no endpoint | **PASS** — `400`, rejeitado na fronteira |
| Exclusões de checkout e passageiro | **PASS** — nada de nome, CPF ou nascimento no corpo enviado |
| Captura de evidência em 320 px | **PASS** — 3 PNG regenerados, revisados, **não versionados** |

#### `NOT RUN` e `BLOCKED` — nada disto virou `PASS`

| Item | Situação |
|---|---|
| Tradução real em Libras pela Rybená | **BLOCKED** — token preso ao domínio autorizado; localhost é recusado pelo fornecedor. T0.4 continua aberta |
| Narração real em voz pela Rybená | **BLOCKED** — mesmo motivo. `switchToVoz()` está integrado e coberto por runtime falso, nunca exercitado de verdade |
| `mode=api` com o token real | **NOT RUN** — depende de T0.4 |
| Smoke real do Gemini nesta rodada | **NOT RUN** — não há credencial local; o endpoint responde `503` honesto |
| Explicação por IA com o prompt revisto (T1.8) | **NOT RUN** — avaliação semântica humana continua pendente |
| Homologação com pessoas surdas sinalizantes | **NOT RUN** |
| NVDA, VoiceOver e pessoas usuárias reais | **NOT RUN** |
| Safari e iOS reais, zoom de 200% | **NOT RUN** |
| `429` do nosso rate limit no navegador | **NOT RUN** ao vivo — coberto por teste e pelo estado renderizado com resposta controlada |

#### Ressalva sobre o que o axe significa

Zero violações continua significando ausência de defeito automatizável, não
acessibilidade comprovada. O axe cobre cerca de um terço dos critérios WCAG.

### Captura de evidência

```bash
# terminal 1, na raiz
npx --yes pnpm@10.28.0 --dir app preview --port 4175

# terminal 2
cd app
node scripts/capture-accessibility-evidence.mjs
```

Não versione perfis de navegador, caches ou credenciais junto às evidências. Uma captura só é versionada depois de revisada e confirmada como representação da interface atual.

### Como registrar resultado

Use `PASS`, `FAIL`, `NOT RUN` e `BLOCKED` separadamente, em `docs/accessibility-agent/VALIDATION.md`. Não transforme pendência externa em falso `PASS`. Não esconda etapa não executada.

---

## 9. Riscos e limites que permanecem

Nada neste plano remove estas limitações. Elas devem constar da apresentação:

- **`axe` não é conformidade.** Cobre cerca de um terço dos critérios WCAG. Zero violações significa ausência de defeitos automatizáveis, não acessibilidade comprovada.
- **Homologação com pessoas usuárias continua pendente** — NVDA, VoiceOver, e pessoas surdas sinalizantes para a qualidade da tradução em Libras.
- **Safari e iOS reais, e zoom de 200%, não foram testados.**
- **O adaptador falso de Libras não prova nada sobre a Rybená.** É ferramenta de desenvolvimento.
- **A quota do handler é por instância** e não sobrevive ao escalonamento de funções stateless. Hospedagem pública exige quota e budget no Google, e rate limit persistente ou WAF na Vercel.
- **O token da Rybená fica observável no navegador**, é temporário e vinculado ao domínio. Precisa ser removido ou rotacionado ao expirar. O parâmetro não consta na documentação pública, mas foi **confirmado pelo fornecedor** no e-mail de provisionamento — ver seção 4.2.
- **O formato do token nunca foi especificado pelo fornecedor.** O regex `/^[a-f0-9]{64}$/i` no código é uma suposição que pode rejeitar o token real e produzir um 503 indistinguível de "não configurado" — ver seção 4.2.
- **A autorização é uma exceção acadêmica**, não uma contratação. Condições, prazo e forma de uso podem diferir do que a documentação pública descreve, e podem mudar sem aviso.
- **Credenciais nunca devem ser compartilhadas em texto** com agentes, em chat, em commits ou em documentos. Elas vivem apenas no cofre da Vercel e em `.env` não versionado.
- **A listagem de projetos Vercel em 19/09/2026 mostrou apenas um projeto.** O segundo (`-5xk5`) citado no `AGENTS.md` não apareceu; confirme com o responsável antes de tratar a pendência como resolvida.

---

## 10. Fontes de verdade

1. `AGENTS.md` — regras operacionais, tem precedência sobre este arquivo;
2. este documento — plano desta rodada de trabalho;
3. `docs/accessibility-agent/PRD.md` — escopo e requisitos;
4. `docs/accessibility-agent/SDD.md` — arquitetura normativa;
5. `docs/accessibility-agent/VALIDATION.md` — matriz e evidências;
6. `docs/guides/08-DEPLOY-VERCEL.md` — hospedagem;
7. `docs/guides/03-ACESSIBILIDADE.md` — diretrizes de acessibilidade do projeto.

Em divergência, preserve a opção mais segura, confirme no código e nos testes, e atualize os documentos afetados. A solicitação explícita do responsável continua sendo a autoridade sobre o objetivo da tarefa.
