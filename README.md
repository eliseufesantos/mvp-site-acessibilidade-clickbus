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
pnpm test:accessibility
```

## Deploy na Vercel

O arquivo `vercel.json` da raiz executa o build da aplicação em `app/` e publica `app/dist`. Ao importar o repositório, mantenha o campo **Root Directory** vazio.

O diagnóstico de `404: NOT_FOUND` e o passo a passo de configuração estão em [`docs/guides/08-DEPLOY-VERCEL.md`](docs/guides/08-DEPLOY-VERCEL.md).

O protótipo é uma simulação acadêmica: não consulta horários reais, não cria pedidos e não processa pagamentos.

Para continuar o projeto em outra sessão ou ferramenta, comece por [`docs/guides/00-CONTINUAR-PROJETO.md`](docs/guides/00-CONTINUAR-PROJETO.md).
