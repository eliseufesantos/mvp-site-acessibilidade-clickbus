# ClickBus — MVP de acessibilidade

Projeto acadêmico (FIAP) que replica a jornada de compra da ClickBus com dados fictícios e acrescenta um plugin de acessibilidade.

```text
busca → resultados → seleção de assento → passageiro → confirmação simulada
```

Não há consulta comercial real, emissão de bilhete, reserva nem pagamento.

## O que o plugin oferece

O acionador fica no fim do cabeçalho, com o pictograma universal de acessibilidade. Ele abre um painel com duas vistas:

- **Assistente** (inicial): um chat que entende pedidos como "aumente o texto" ou "o que é viação?". A IA (Gemini) só **planeja**: devolve um plano tipado, e um executor local valida e aplica ferramentas que já existem. Ela não recebe a página, não navega e não gera código.
- **Recursos**: grade com Libras, Voz, Ajustes visuais e Sobre.

| Recurso | Como funciona |
| --- | --- |
| Ajustes visuais | contraste, tamanho do texto, controles e cursor grandes, destaques, espaçamento, entrelinha, alinhamento, guia e máscara de leitura, movimento reduzido, fonte para dislexia, saturação e correção de cores. Funcionam sem rede e ficam salvos no navegador |
| Dicionário e simplificação | glossário e textos simplificados revisados respondem localmente, antes de qualquer chamada à IA. O texto original nunca é substituído |
| Libras e voz | dois modos do mesmo player da Rybená, carregado só depois de um clique |

No desktop o painel é uma região lateral que não bloqueia a página; no celular (até 820 px) é um diálogo em tela cheia.

## Tecnologias

| Camada | Tecnologia | Para quê |
| --- | --- | --- |
| Interface | React 18 + TypeScript (modo estrito) | componentes e estado da jornada |
| Build e servidor local | Vite 6 | servidor de desenvolvimento e empacotamento |
| Estilo | CSS próprio com tokens | identidade visual da réplica, sem biblioteca de componentes |
| Ícones e fontes | Lucide React, Fontsource (Rubik e Roboto Mono) | ícones e fontes servidas localmente |
| Servidor | Funções Vercel em TypeScript | rotas `/api/accessibility/*` |
| IA | Google Gemini (API REST `generateContent`) | planejamento dos pedidos do chat, apenas no servidor |
| Libras e voz | Rybená | tradução em Libras e leitura em voz |
| Testes de unidade e componente | Vitest, jsdom, Testing Library | lógica, componentes e regiões vivas |
| Testes em navegador | Playwright + axe-core | WCAG 2.1 AA automatizado, reflow em 320 px e layout |
| Gerenciador de pacotes | pnpm 10.28.0 (via `npx`) | instalação reproduzível com lockfile |
| Hospedagem e CI | Vercel, GitHub Actions | deploy e testes em todo pull request |

## Estrutura

```text
.
├── README.md                 # este guia
├── AGENTS.md                 # regras e invariantes para agentes de código (o Claude Code também lê este arquivo)
├── package.json              # só declara "type": "module" para as funções da Vercel
├── tsconfig.json             # checagem de tipos das funções em api/
├── vercel.json               # instalação, build, saída e rewrite da SPA
├── .vercelignore             # envia à Vercel só app/, api/ e os arquivos de configuração
├── .github/workflows/        # CI: typecheck, build, Vitest e Playwright
├── .claude/launch.json       # atalho do app Claude para abrir o servidor de desenvolvimento
│
├── api/accessibility/        # funções Vercel: plan, explain, simplify e rybena
│                             # (cada uma só repassa a chamada para app/server/)
│
└── app/                      # a aplicação
    ├── index.html
    ├── package.json          # dependências e scripts
    ├── vite.config.ts        # servidor local, que também monta as rotas /api
    ├── vitest.config.ts      # configuração dos testes de unidade
    ├── playwright.config.ts  # configuração dos testes em navegador
    ├── public/               # cursores grandes em SVG
    ├── server/accessibility/ # handler HTTP, prompt, provedor Gemini e configuração Rybená
    ├── e2e/                  # testes Playwright: axe, reflow e layout
    └── src/
        ├── main.tsx          # ponto de entrada e ordem dos estilos
        ├── app/App.tsx       # máquina de estados da jornada (sem router)
        ├── types.ts          # tipos compartilhados
        ├── data/trips.ts     # viagens fictícias
        ├── components/       # marca, cabeçalho e UI genérica (Button, Dialog, Switch…)
        ├── features/         # uma pasta por etapa: search, results, seats, checkout, confirmation
        │   └── accessibility-agent/   # todo o plugin de acessibilidade
        │       ├── core/              # contratos, preferências, executor, glossário, cliente da IA
        │       ├── adapters/          # conteúdo da ClickBus e integração com a Rybená
        │       ├── ui/                # painel, controles, ajudas de leitura, filtros de cor e CSS
        │       └── tests/             # testes Vitest do plugin
        ├── styles/           # tokens.css → global.css → components.css
        └── utils/            # datas e foco
```

Por que `api/` e `app/server/` são separados: a Vercel só publica funções que estão em `api/` na raiz. Os handlers ficam em `app/server/` para que o mesmo código atenda o servidor local do Vite e a produção.

`docs/` e `academico/` existem só na máquina local e estão no `.gitignore`: são a documentação interna detalhada e o material da disciplina.

## Como rodar

Requer Node.js 20 ou superior. Não é preciso instalar o pnpm; os comandos usam a versão fixa via `npx`. Na raiz:

```bash
npx --yes pnpm@10.28.0 --dir app install --frozen-lockfile
```

```bash
npx --yes pnpm@10.28.0 --dir app dev
```

A aplicação abre em [http://127.0.0.1:4173/](http://127.0.0.1:4173/).

Nenhuma variável de ambiente é necessária para a jornada, os ajustes visuais, o glossário e as simplificações locais. Sem as credenciais, o chat responde que a IA está indisponível e oferece o atalho para Recursos.

Para exercitar Libras e voz sem a Rybená real, rode o servidor com `VITE_A11Y_LIBRAS_SIMULATION=on`. A simulação exibe um aviso permanente e nunca entra no bundle de produção.

## Testes

| Comando | O que faz |
| --- | --- |
| `npx --yes pnpm@10.28.0 --dir app typecheck` | checagem de tipos do app e dos testes |
| `npx --yes pnpm@10.28.0 --dir app build` | build de produção em `app/dist` |
| `npx --yes pnpm@10.28.0 --dir app test` | Vitest: lógica e componentes |
| `npx --yes pnpm@10.28.0 --dir app test:e2e` | Playwright: axe, reflow em 320 px e fronteira 820/821 px |
| `npx --yes pnpm@10.28.0 --dir app test:all` | as duas camadas |

Antes do primeiro `test:e2e`, baixe o navegador:

```bash
npx --yes pnpm@10.28.0 --dir app exec playwright install chromium
```

Nenhum teste fala com o Gemini ou com a Rybená: a rede é sempre simulada.

## Deploy e variáveis de ambiente

O deploy na Vercel parte da raiz, com **Root Directory vazio**; o `vercel.json` já define instalação, build e saída. As credenciais ficam só no servidor, em **Settings > Environment Variables**:

```text
ACCESSIBILITY_LLM_ENDPOINT=https://generativelanguage.googleapis.com/v1beta
ACCESSIBILITY_LLM_MODEL=<modelo>
ACCESSIBILITY_LLM_API_KEY=<segredo>
RYBENA_ACCESS_TOKEN=<credencial, só no domínio autorizado>
```

Opcionais: `ACCESSIBILITY_ALLOWED_ORIGINS`, `ACCESSIBILITY_LLM_REQUESTS_PER_MINUTE` (padrão 12) e `ACCESSIBILITY_LLM_REQUESTS_PER_DAY` (padrão 200).

Nunca use o prefixo `VITE_` para segredos: ele os coloca no bundle público. Ao editar o `.vercelignore`, preserve `!package.json` e `!tsconfig.json`; sem eles as funções quebram em produção.

## Estado e limitações

- **Verificado:** typecheck, build, Vitest e Playwright passando; axe sem violações nas cinco etapas e com o painel aberto; sem rolagem horizontal em 320 px; Gemini e endpoint da Rybená respondendo no domínio autorizado.
- **Qualidade das respostas da IA:** parcial. Explicações vindas da IA podem errar, e a interface pede que a pessoa confira.
- **Não executado:** tradução real da Rybená com evidência registrada, homologação com pessoas surdas sinalizantes, leitores de tela (NVDA e VoiceOver), Safari/iOS real e testes com pessoas usuárias.

Passar no axe não equivale a conformidade com a WCAG: ele cobre só parte dos critérios.
