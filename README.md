# ClickBus — MVP de acessibilidade

Projeto acadêmico que simula a jornada principal da ClickBus com melhorias de acessibilidade de baixo custo e alto impacto visual.

O MVP está implementado e inclui busca, resultados, seleção de assento, formulário de passageiro, confirmação simulada, alto contraste, modo idoso, tradução em Libras pelo VLibras e redução de movimento.

## Estrutura

- `app/`: aplicação React + TypeScript + Vite.
- `docs/guides/`: guias técnicos e de continuidade.
- `docs/brand/`: brandbook e design system recebidos como referência.
- `docs/resumo-implementacao.html`: documento A4 que gera o resumo executivo.
- `entregas/`: documentos finais em PDF e DOCX.
- `scripts/`: geradores reproduzíveis dos entregáveis.

## Executar

```bash
cd app
pnpm install
pnpm dev
```

Para validar a versão de produção:

```bash
pnpm build
pnpm preview
```

## Deploy na Vercel

O arquivo `vercel.json` da raiz executa o build da aplicação em `app/` e publica `app/dist`. Ao importar o repositório, mantenha o campo **Root Directory** vazio.

O diagnóstico de `404: NOT_FOUND` e o passo a passo de configuração estão em [`docs/guides/08-DEPLOY-VERCEL.md`](docs/guides/08-DEPLOY-VERCEL.md).

O protótipo é uma simulação acadêmica: não consulta horários reais, não cria pedidos e não processa pagamentos.

Para continuar o projeto em outra sessão ou ferramenta, comece por [`docs/guides/00-CONTINUAR-PROJETO.md`](docs/guides/00-CONTINUAR-PROJETO.md).
