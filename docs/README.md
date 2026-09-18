# Documentação do projeto

## Comece por aqui

- [`RESUMO-PARA-APRESENTACAO.md`](RESUMO-PARA-APRESENTACAO.md): visão executiva e roteiro-base de dez slides.
- [`accessibility-agent/README.md`](accessibility-agent/README.md): índice da documentação de produto, arquitetura, implementação e validação do plugin.
- [`guides/00-CONTINUAR-PROJETO.md`](guides/00-CONTINUAR-PROJETO.md): retomada rápida do desenvolvimento.

## Guias ativos

- `guides/01-ARQUITETURA.md`: estrutura e responsabilidades do código.
- `guides/02-DESIGN-SYSTEM.md`: tokens, identidade e componentes.
- `guides/03-ACESSIBILIDADE.md`: visão concisa do comportamento acessível.
- `guides/05-DESENVOLVIMENTO.md`: instalação, comandos e convenções.
- `guides/08-DEPLOY-VERCEL.md`: configuração e diagnóstico do deploy.

A matriz atual de QA é [`accessibility-agent/VALIDATION.md`](accessibility-agent/VALIDATION.md). Os antigos guias separados de fluxo, QA e resumo de implementação foram removidos por redundância ou desatualização.

## Material histórico

- `clickbus-mapping/`: análise realizada em 08/09/2026 sobre uma versão anterior da réplica. As capturas e snapshots brutos foram removidos; os documentos restantes preservam apenas o contexto histórico.
- `Pesquisa_Rybena_FIAP.docx`: pesquisa anterior à especificação atual. Suas propostas não substituem o PRD e o SDD.

## Referências de marca

- `brand/brand-book-a4.pdf`: manual de marca fornecido para o projeto.
- `brand/brand-book-a4.html`: mesma peça em HTML, fonte do PDF acima.
- `brand/design-system.html`: tokens e componentes visuais extraídos da ClickBus.

## Entregáveis

Os documentos finais ficam em `entregas/`, na raiz do repositório:

| Arquivo | O que é |
| --- | --- |
| `Escopo_Tecnico_MVP_ClickBus_Web.pdf` | escopo técnico elaborado para o MVP |
| `Escopo_Tecnico_MVP_ClickBus_Web.docx` | mesma peça em formato editável, gerada por `scripts/build_mvp_scope.py` |
| `Escopo_Original_ClickBus_MVP.pdf` | escopo recebido no início do projeto |

Os conceitos visuais antigos e as capturas desatualizadas foram removidos. O histórico do Git preserva esses arquivos caso seja necessário consultar a evolução do projeto.
