# Desenvolvimento

## Requisitos

- Node.js 20 ou superior;
- npm e npx disponíveis.

## Instalação

Na raiz do repositório:

```bash
npx --yes pnpm@10.28.0 --dir app install --frozen-lockfile
```

`pnpm-workspace.yaml` autoriza somente o script de build do `esbuild`, necessário ao Vite.

## Rotina local

```bash
npx --yes pnpm@10.28.0 --dir app dev
```

URL: `http://127.0.0.1:4173/`.

Antes de criar um commit:

```bash
npx --yes pnpm@10.28.0 --dir app typecheck
npx --yes pnpm@10.28.0 --dir app build
npx --yes pnpm@10.28.0 --dir app test:accessibility
```

O material atual para apresentação está em `docs/RESUMO-PARA-APRESENTACAO.md`. Os geradores históricos de entregáveis não fazem parte da rotina padrão de desenvolvimento.

## Convenções

- componentes em PascalCase;
- dados compartilhados em `data/`;
- tipos compartilhados em `types.ts`;
- regras de negócio dentro da feature correspondente;
- tokens visuais em `styles/tokens.css`;
- ícones de interface via Lucide;
- sem dados reais nem chamadas de negócio externas;
- nenhum script VLibras/Rybená no runtime atual;
- IA somente pelo backend e somente com endpoint, modelo e chave explicitamente configurados;
- nunca usar chave de provedor no bundle do frontend.

## Alterações comuns

- nova viagem: editar `src/data/trips.ts`;
- nova preferência: ampliar `AccessibilityPreferences`, o hook e o painel;
- nova cor ou dimensão global: editar `styles/tokens.css`;
- nova etapa: editar `JourneyStep` e `App.tsx`;
- nova evidência do painel: executar `app/scripts/capture-accessibility-evidence.mjs`, revisar a captura e versioná-la somente se representar a interface atual.
