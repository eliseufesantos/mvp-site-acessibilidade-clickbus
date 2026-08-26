# ClickBus — MVP de acessibilidade

Projeto acadêmico que simula a jornada principal da ClickBus com melhorias de acessibilidade de baixo custo e alto impacto visual.

O MVP está implementado e inclui busca, resultados, seleção de assento, formulário de passageiro, confirmação simulada, alto contraste, modo idoso e redução de movimento.

## Estrutura

- `app/`: aplicação React + TypeScript + Vite.
- `docs/brand/`: brandbook e design system recebidos como referência.
- `docs/concepts/`: conceitos visuais usados para orientar a implementação.
- `docs/scope/`: escopo original do MVP.
- `docs/guides/`: guias técnicos e de continuidade.
- `output/`: documentos gerados durante a análise do projeto.
- `docs/audit/`: evidências e capturas dos sites analisados.

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

O protótipo é uma simulação acadêmica: não consulta horários reais, não cria pedidos e não processa pagamentos.

Para continuar o projeto em outra sessão ou ferramenta, comece por [`docs/guides/00-CONTINUAR-PROJETO.md`](docs/guides/00-CONTINUAR-PROJETO.md).
