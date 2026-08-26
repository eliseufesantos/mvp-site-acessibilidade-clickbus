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

Para regenerar o resumo executivo em PDF a partir da raiz do projeto:

```bash
node scripts/build-implementation-summary.mjs
```

O conteúdo vive em `docs/implementation/resumo-implementacao-a4.html`, um documento A4 que pode ser aberto direto no navegador. O script imprime esse HTML com o Chrome ou o Edge do sistema em modo headless, sem dependências de npm, e salva em `output/pdf/Resumo_Implementacao_MVP_ClickBus_Acessivel.pdf`.

As capturas usadas no PDF ficam na mesma pasta do HTML e são referenciadas por caminho relativo. Se mover o HTML, mova as imagens junto.

## Convenções

- componentes em PascalCase;
- dados compartilhados em `data/`;
- tipos compartilhados em `types.ts`;
- regras de negócio dentro da feature correspondente;
- tokens visuais em `styles/tokens.css`;
- ícones de interface via Lucide;
- sem dados reais nem chamadas de negócio externas; a única dependência de rede é o widget do VLibras.

## Alterações comuns

- nova viagem: editar `src/data/trips.ts`;
- nova preferência: ampliar `AccessibilityPreferences`, o hook e o painel;
- nova cor ou dimensão global: editar `styles/tokens.css`;
- nova etapa: editar `JourneyStep` e `App.tsx`;
- nova evidência para o PDF: gerar a captura, salvar em `docs/implementation/` e referenciar no HTML A4.
