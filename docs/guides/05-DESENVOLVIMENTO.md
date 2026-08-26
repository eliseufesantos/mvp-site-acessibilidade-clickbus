# Desenvolvimento

## Requisitos

- Node.js 20 ou superior;
- pnpm 9 ou superior.

## Instalação

```bash
cd app
pnpm install
```

`pnpm-workspace.yaml` autoriza somente o script de build do `esbuild`, necessário ao Vite.

## Rotina local

```bash
pnpm dev
```

URL: `http://127.0.0.1:4173/`.

Antes de criar um commit:

```bash
pnpm typecheck
pnpm build
```

## Convenções

- componentes em PascalCase;
- dados compartilhados em `data/`;
- tipos compartilhados em `types.ts`;
- regras de negócio dentro da feature correspondente;
- tokens visuais em `styles/tokens.css`;
- ícones de interface via Lucide;
- sem dados reais ou chamadas externas no MVP.

## Alterações comuns

- nova viagem: editar `src/data/trips.ts`;
- nova preferência: ampliar `AccessibilityPreferences`, o hook e o painel;
- nova cor ou dimensão global: editar `styles/tokens.css`;
- nova etapa: editar `JourneyStep` e `App.tsx`;
- novo texto acadêmico: manter explícito que não há compra real.

