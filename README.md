# ClickBus — MVP de acessibilidade

Projeto acadêmico que simula a jornada principal da ClickBus com melhorias de acessibilidade de baixo custo e alto impacto visual.

O MVP inclui busca, resultados, seleção de assento, formulário de passageiro e confirmação simulada. A evolução **Acessibilidade Assistida por IA** acrescenta controles visuais e de leitura independentes, persistência/migração, desfazer, glossário, simplificação preparada, voz opcional e um planejador tipado no servidor, com adaptador REST nativo para Gemini já implementado.

Não é necessário instalar ou implementar uma LLM local. Sem credenciais no runtime, os recursos manuais e locais continuam funcionando e os endpoints externos retornam indisponibilidade controlada. Na integração Rybená, handler, URL e contrato do adaptador foram validados localmente; o token temporário vinculado ao domínio autorizado foi recebido, mas configuração na Vercel e o caminho navegador/CDN/player ainda estão `NOT RUN`.

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

Credenciais são necessárias somente para habilitar Gemini ou Rybená reais no runtime escolhido. As variáveis devem ficar no servidor ou no cofre da Vercel, nunca em `VITE_*`, no código ou na documentação. Para a Rybená, `RYBENA_ACCESS_TOKEN` alimenta `GET /api/accessibility/rybena`, que retorna uma URL de CDN `no-store` somente quando o loader é acionado; por exigência do fornecedor, o valor fica observável nessa URL no navegador. A configuração de hospedagem, segurança, expiração, quota e orçamento está descrita em [`docs/guides/08-DEPLOY-VERCEL.md`](docs/guides/08-DEPLOY-VERCEL.md).

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

## Testes

A suíte tem duas camadas, e cada uma pega um tipo de defeito que a outra não enxerga.

**Unidade e componente (Vitest).** Lógica pura roda em ambiente `node`; componentes, hooks e regiões vivas rodam num DOM simulado (jsdom). Leva alguns segundos.

```bash
npx --yes pnpm@10.28.0 --dir app test
npx --yes pnpm@10.28.0 --dir app test:coverage
```

**Navegador real (Playwright).** O jsdom não calcula geometria, então layout só se testa num navegador de verdade. Os testes rodam em desktop, em celular no Chromium e em celular no WebKit — o motor do Safari — e incluem auditoria automática de WCAG 2.1 AA com o axe em cada etapa da jornada e em cada vista do painel. Na primeira vez, baixe os navegadores:

```bash
npx --yes pnpm@10.28.0 --dir app exec playwright install chromium webkit
npx --yes pnpm@10.28.0 --dir app test:e2e
```

`test:all` roda as duas camadas. `test:accessibility` continua existindo e roda a camada do Vitest.

Nenhum teste fala com a Gemini nem com o CDN da Rybená: a rede e o fornecedor são sempre simulados. Passar no axe não é conformidade comprovada — ele cobre só parte dos critérios da WCAG.

## Deploy na Vercel

O arquivo `vercel.json` da raiz executa o build da aplicação em `app/` e publica `app/dist`. Ao importar o repositório, mantenha o campo **Root Directory** vazio.

O diagnóstico de `404: NOT_FOUND` e o passo a passo de configuração estão em [`docs/guides/08-DEPLOY-VERCEL.md`](docs/guides/08-DEPLOY-VERCEL.md).

O protótipo é uma simulação acadêmica: não consulta horários reais, não cria pedidos e não processa pagamentos.

Para preparar uma apresentação, use [`docs/RESUMO-PARA-APRESENTACAO.md`](docs/RESUMO-PARA-APRESENTACAO.md).

Para continuar o projeto em outra sessão ou ferramenta, comece por [`docs/guides/00-CONTINUAR-PROJETO.md`](docs/guides/00-CONTINUAR-PROJETO.md).
