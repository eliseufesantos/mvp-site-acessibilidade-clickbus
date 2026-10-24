# ClickBus — MVP de acessibilidade

Projeto acadêmico que replica a jornada principal da ClickBus com dados fictícios — busca, resultados, seleção de assento, passageiro e confirmação simulada — e acrescenta um plugin de acessibilidade.

O plugin reúne:

- ajustes visuais e de leitura que funcionam sem rede;
- um assistente que entende pedidos em linguagem natural, com o Gemini atuando só como planejador no servidor;
- Libras e voz pela Rybená.

Não há consulta comercial real, emissão de bilhete nem pagamento.

## Estrutura

- `app/`: aplicação React + TypeScript + Vite, com o servidor em `app/server/`.
- `api/`: funções Vercel, que repassam a chamada aos handlers de `app/server/`.
- `docs/`: produto, arquitetura, desenvolvimento, deploy e validação. Comece pelo [`docs/README.md`](docs/README.md).
- `academico/`: material da disciplina, separado da solução: resumo para apresentação, entregáveis, pesquisa Rybená e os geradores desses documentos.
- `AGENTS.md`: regras para agentes de código.

## Início rápido

Requer Node.js 20 ou superior. Na raiz:

```bash
npx --yes pnpm@10.28.0 --dir app install --frozen-lockfile
npx --yes pnpm@10.28.0 --dir app dev
```

A aplicação abre em [http://127.0.0.1:4173/](http://127.0.0.1:4173/).

Nenhuma variável de ambiente é necessária para a jornada, os ajustes manuais, o glossário e as simplificações locais. Gemini e Rybená reais exigem credenciais apenas no servidor; veja [`docs/DEPLOY-VERCEL.md`](docs/DEPLOY-VERCEL.md).

Testes, convenções e a rotina antes de entregar estão em [`docs/DESENVOLVIMENTO.md`](docs/DESENVOLVIMENTO.md). O que já foi verificado e o que está pendente estão em [`docs/VALIDACAO.md`](docs/VALIDACAO.md).

Para preparar uma apresentação, use [`academico/RESUMO-PARA-APRESENTACAO.md`](academico/RESUMO-PARA-APRESENTACAO.md).
