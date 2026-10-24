# Material acadêmico

Documentos da disciplina, mantidos fora da solução. Nada nesta pasta é lido pelo build, pelos testes ou pelo deploy.

| Caminho | O que é |
| --- | --- |
| `RESUMO-PARA-APRESENTACAO.md` | visão executiva e roteiro-base de dez slides |
| `entregas/Escopo_Tecnico_MVP_ClickBus_Web.pdf` | escopo técnico elaborado para o MVP |
| `entregas/Escopo_Tecnico_MVP_ClickBus_Web.docx` | mesma peça em formato editável, gerada por `scripts/build_mvp_scope.py` |
| `entregas/Escopo_Original_ClickBus_MVP.pdf` | escopo recebido no início do projeto |
| `pesquisa-rybena/Pesquisa_Rybena_FIAP.docx` | pesquisa anterior à especificação atual; suas propostas não substituem `docs/PRODUTO.md` |
| `pesquisa-rybena/report-source.md` | texto-fonte da pesquisa |
| `pesquisa-rybena/build_rybena_report.py` | gera o DOCX da pesquisa a partir do texto-fonte |
| `pesquisa-rybena/rendered/` | PDF e páginas renderizadas da pesquisa, usados na revisão visual |
| `pesquisa-rybena/a11y.json` | registro da verificação de acessibilidade do DOCX, feita quando ele ainda estava em `docs/` |
| `scripts/build_mvp_scope.py` | gerador histórico do escopo técnico |

Os geradores são Python e dependem de `python-docx`. Eles resolvem os caminhos a partir da própria localização e não fazem parte da rotina de desenvolvimento.

A documentação técnica — produto, arquitetura, validação e guias — continua em [`../docs/`](../docs/README.md).
