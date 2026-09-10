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
pnpm test:accessibility
```

Para regenerar o resumo executivo em PDF a partir da raiz do projeto:

```bash
node scripts/build-implementation-summary.mjs
```

O conteúdo vive em `docs/resumo-implementacao.html`, um documento A4 que pode ser aberto direto no navegador. O script imprime esse HTML com o Chrome ou o Edge do sistema em modo headless, sem dependências de npm, e salva em `entregas/Resumo_Implementacao_MVP_ClickBus_Acessivel.pdf`.

O HTML é auto-contido: as capturas estão embutidas nele como JPEG em data URI. Não existe pasta de imagens ao lado, e o arquivo pode ser movido ou enviado sozinho.

O escopo técnico em DOCX tem seu próprio gerador, em Python:

```bash
python scripts/build_mvp_scope.py
```

Ele depende de `python-docx` e das capturas de auditoria, que saíram da árvore do repositório e precisam ser restauradas antes (`git checkout 5ebc728 -- docs/audit`). O cabeçalho do arquivo detalha os requisitos.

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
- nova evidência para o PDF: converter a captura em data URI e colar no `src` da imagem dentro do HTML A4.
