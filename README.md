# ClickBus — MVP de acessibilidade

Projeto acadêmico que simula a jornada principal da ClickBus com melhorias de acessibilidade de baixo custo e alto impacto visual.

O MVP inclui busca, resultados, seleção de assento, formulário de passageiro e confirmação simulada. A evolução **Acessibilidade Assistida por IA** acrescenta controles visuais e de leitura independentes, persistência/migração, desfazer, glossário, simplificação preparada, voz opcional e um planejador tipado no servidor, com adaptador REST nativo para Gemini já implementado.

Não é necessário instalar ou implementar uma LLM local. Sem credenciais no runtime, os recursos manuais e locais continuam funcionando e os endpoints de IA retornam indisponibilidade controlada. A integração demonstrativa da Rybená também está implementada; a tradução real permanece bloqueada enquanto o fornecedor não autorizar o domínio ou token da demonstração.

## Estrutura

- `app/`: aplicação React + TypeScript + Vite.
- `docs/guides/`: guias técnicos e de continuidade.
- `docs/brand/`: brandbook e design system recebidos como referência.
- `docs/RESUMO-PARA-APRESENTACAO.md`: síntese executiva e roteiro-base para slides.
- `entregas/`: documentos finais em PDF e DOCX.
- `scripts/`: utilitários históricos de geração dos entregáveis acadêmicos.

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

Nenhuma variável de ambiente é necessária para executar a jornada simulada, os controles manuais, o glossário e as simplificações locais. O adaptador Gemini já faz parte do servidor; não há modelo local, serviço adicional ou implementação de provedor a configurar no computador de desenvolvimento.

Credenciais são necessárias somente para habilitar chamadas reais ao Gemini no runtime escolhido. Elas devem permanecer no servidor ou no cofre da Vercel, nunca em variáveis `VITE_*`, no código ou na documentação. A configuração de hospedagem, segurança, quota e orçamento está descrita em [`docs/guides/08-DEPLOY-VERCEL.md`](docs/guides/08-DEPLOY-VERCEL.md).

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

Para preparar uma apresentação, use [`docs/RESUMO-PARA-APRESENTACAO.md`](docs/RESUMO-PARA-APRESENTACAO.md).

Para continuar o projeto em outra sessão ou ferramenta, comece por [`docs/guides/00-CONTINUAR-PROJETO.md`](docs/guides/00-CONTINUAR-PROJETO.md).
