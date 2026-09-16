# ClickBus — MVP de acessibilidade

Projeto acadêmico que simula a jornada principal da ClickBus com melhorias de acessibilidade de baixo custo e alto impacto visual.

O MVP inclui busca, resultados, seleção de assento, formulário de passageiro e confirmação simulada. A evolução **Acessibilidade Assistida por IA** acrescenta controles visuais e de leitura independentes, persistência/migração, desfazer, glossário, simplificação preparada, voz opcional e um planejador tipado no servidor.

A IA fica desativada até a configuração explícita de provedor, modelo e chave no servidor. A autorização gratuita da Rybená está confirmada, mas a API/SDK/player ainda não foi liberada/configurada; por isso a interface mostra indisponibilidade e atribuição sem carregar script ou simular tradução.

## Estrutura

- `app/`: aplicação React + TypeScript + Vite.
- `docs/guides/`: guias técnicos e de continuidade.
- `docs/brand/`: brandbook e design system recebidos como referência.
- `docs/resumo-implementacao.html`: documento A4 que gera o resumo executivo.
- `entregas/`: documentos finais em PDF e DOCX.
- `scripts/`: geradores dos entregáveis (resumo em PDF e escopo técnico em DOCX).

## Pré-requisitos

- Node.js 20 ou superior, com `npm` e `npx` disponíveis;
- acesso à internet na primeira instalação das dependências.

Os comandos abaixo executam o pnpm 10.28.0 por meio do `npx`, portanto não é necessário instalar o pnpm globalmente. Se optar por uma instalação global, use pnpm 9 ou superior.

## Instalação e execução

Na raiz do repositório:

```bash
npx --yes pnpm@10.28.0 --dir app install --frozen-lockfile
npx --yes pnpm@10.28.0 --dir app dev
```

A aplicação ficará disponível em [http://127.0.0.1:4173/](http://127.0.0.1:4173/). Use `Ctrl+C` para encerrar o servidor.

Nenhuma variável de ambiente é necessária para executar a jornada simulada, os controles manuais de acessibilidade e o glossário local.

O planejamento e as ferramentas de conteúdo que dependem de IA são opcionais. Para ativá-los, configure estas variáveis somente no ambiente do servidor:

```text
ACCESSIBILITY_LLM_ENDPOINT
ACCESSIBILITY_LLM_MODEL
ACCESSIBILITY_LLM_API_KEY
```

Sem as três variáveis, os endpoints de IA respondem com HTTP `503` de forma controlada e o restante do MVP continua funcionando. Não exponha esses valores em variáveis `VITE_*`.

## Validação local

Execute as verificações a partir da raiz:

```bash
npx --yes pnpm@10.28.0 --dir app typecheck
npx --yes pnpm@10.28.0 --dir app build
npx --yes pnpm@10.28.0 --dir app test:accessibility
```

Depois do build, encerre o servidor de desenvolvimento e confira a versão de produção localmente com:

```bash
npx --yes pnpm@10.28.0 --dir app preview
```

O `preview` também usa [http://127.0.0.1:4173/](http://127.0.0.1:4173/) e mantém o terminal ocupado até ser encerrado com `Ctrl+C`.

## Deploy na Vercel

O arquivo `vercel.json` da raiz executa o build da aplicação em `app/` e publica `app/dist`. Ao importar o repositório, mantenha o campo **Root Directory** vazio.

O diagnóstico de `404: NOT_FOUND` e o passo a passo de configuração estão em [`docs/guides/08-DEPLOY-VERCEL.md`](docs/guides/08-DEPLOY-VERCEL.md).

O protótipo é uma simulação acadêmica: não consulta horários reais, não cria pedidos e não processa pagamentos.

Para continuar o projeto em outra sessão ou ferramenta, comece por [`docs/guides/00-CONTINUAR-PROJETO.md`](docs/guides/00-CONTINUAR-PROJETO.md).
