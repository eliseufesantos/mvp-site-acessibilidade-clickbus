# Documentação

| Documento | Para quê |
| --- | --- |
| [PRODUTO.md](PRODUTO.md) | o que o protótipo faz, o que fica de fora e as decisões de produto |
| [ARQUITETURA.md](ARQUITETURA.md) | estrutura do código, contratos, Gemini, Rybená e segurança |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | tokens, tipografia e regras visuais da réplica e do painel |
| [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md) | instalar, rodar, testar e convenções |
| [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md) | configuração da Vercel, variáveis e problemas conhecidos |
| [VALIDACAO.md](VALIDACAO.md) | o que foi verificado, o que está pendente e como registrar |
| `brand/` | brandbook e design system recebidos como referência |

- **Estado:** `PASS`, `NOT RUN` e afins ficam só em `VALIDACAO.md`. Os outros documentos descrevem comportamento e apontam para lá, para não divergirem.
- **Regras para agentes:** estão no [`AGENTS.md`](../AGENTS.md).
- **Material acadêmico:** entregáveis, pesquisa e resumo para apresentação estão em [`../academico/`](../academico/README.md).

Planos de execução, auditorias, diários de validação e o mapeamento da versão anterior da réplica foram removidos em 24/10/2026. As decisões que ainda valem foram para `PRODUTO.md`. O material antigo pode ser consultado no Git:

```bash
git show b59dc9b:docs/guides/09-PLANO-EVOLUCAO-ACESSIBILIDADE.md
```
