# Desenvolvimento

## Requisitos

- Node.js 20 ou superior, com `npm` e `npx`;
- internet na primeira instalação.

Os comandos usam o pnpm 10.28.0 por `npx`, então não é preciso instalar o pnpm. `app/pnpm-workspace.yaml` autoriza só o script de build do `esbuild`, que o Vite precisa.

## Comandos

Da raiz, para reproduzir a configuração da Vercel:

```bash
npx --yes pnpm@10.28.0 --dir app install --frozen-lockfile
npx --yes pnpm@10.28.0 --dir app dev          # http://127.0.0.1:4173/
npx --yes pnpm@10.28.0 --dir app typecheck
npx --yes pnpm@10.28.0 --dir app build
npx --yes pnpm@10.28.0 --dir app test         # Vitest
npx --yes pnpm@10.28.0 --dir app test:e2e     # Playwright
npx --yes pnpm@10.28.0 --dir app preview
```

`test:all` roda as duas camadas, e `test:accessibility` é um alias do Vitest. Antes do primeiro `test:e2e`, baixe o navegador:

```bash
npx --yes pnpm@10.28.0 --dir app exec playwright install chromium
```

Nenhuma variável de ambiente é necessária para a jornada, os ajustes manuais, o glossário e as simplificações locais. Para exercitar Libras e voz sem a Rybená real, ligue a simulação de desenvolvimento com `VITE_A11Y_LIBRAS_SIMULATION=on`. Ela nunca entra no bundle de produção.

## Antes de entregar

```bash
npx --yes pnpm@10.28.0 --dir app typecheck
npx --yes pnpm@10.28.0 --dir app build
npx --yes pnpm@10.28.0 --dir app test
```

Se a mudança tocar layout, CSS, o painel ou alguma etapa da jornada, rode também `test:e2e`. O GitHub Actions (`.github/workflows/testes.yml`) roda typecheck, build e as duas camadas em todo pull request e em todo push para `main`.

## Testes

As duas camadas não se substituem:

- **Vitest** cobre lógica pura (ambiente `node`) e componentes, hooks e regiões vivas num DOM simulado. Um arquivo que precisa de DOM declara `// @vitest-environment jsdom` no topo.
- **Playwright** cobre o que o jsdom não enxerga, que é geometria: o jsdom devolve zero em `getBoundingClientRect`.
  - Roda em desktop e em celular a 320 CSS px.
  - Audita WCAG 2.1 AA com o axe em cada etapa e em cada vista do painel.
  - Mede reflow e testa a fronteira 820/821 px.

Nenhum teste fala com a Gemini nem com o CDN da Rybená. A rede e o fornecedor são sempre simulados, e um double não prova a integração real.

**Um teste que passa na primeira execução ainda não provou nada.** Ao escrever um teste, quebre de propósito o comportamento protegido na fonte e confirme que ele falha. Ao fazer essa mutação, preserve os bytes do arquivo original: no Windows, regravar em modo texto troca LF por CRLF sem aviso.

## Convenções

- Componentes em PascalCase.
- Dados compartilhados em `data/` e tipos compartilhados em `types.ts`.
- Regras de negócio ficam dentro da feature correspondente.
- Tudo o que é do plugin de acessibilidade mora em `features/accessibility-agent/`.
- Tokens visuais em `styles/tokens.css`.
- Ícones via Lucide.
- Sem dados reais e sem chamadas comerciais externas.
- Segredos só no runtime do servidor.

## Alterações comuns

| Mudança | Onde mexer |
| --- | --- |
| Nova viagem | `src/data/trips.ts` |
| Nova preferência | `AccessibilityPreferences` em `types.ts`, `core/preferences.ts`, o esquema em `core/contracts.ts` e `ui/PreferenceControls.tsx` |
| Novo termo no glossário | `core/glossary.ts` |
| Novo trecho público para simplificar | `adapters/clickbus/content.ts` |
| Nova cor ou dimensão global | `styles/tokens.css` |
| Nova etapa da jornada | `JourneyStep` em `types.ts` e `app/App.tsx` |
