# Documentação do projeto

## Guias de continuidade

Leia nesta ordem para entender o projeto por inteiro.

- `guides/00-CONTINUAR-PROJETO.md`: ponto de partida para outra sessão.
- `guides/01-ARQUITETURA.md`: estrutura e responsabilidades do código.
- `guides/02-DESIGN-SYSTEM.md`: tokens, identidade e componentes.
- `guides/03-ACESSIBILIDADE.md`: comportamento dos modos e navegação acessível.
- `guides/04-FLUXO-E-DADOS.md`: jornada, estados e dados fictícios.
- `guides/05-DESENVOLVIMENTO.md`: instalação, comandos e convenções.
- `guides/06-QA.md`: validações executadas e riscos restantes.
- `guides/07-RESUMO-IMPLEMENTACAO.md`: resumo técnico das escolhas de implementação.
- `guides/08-DEPLOY-VERCEL.md`: configuração e diagnóstico do deploy.

## Resumo executivo

`resumo-implementacao.html` é o documento A4 apresentável do projeto. Pode ser aberto direto no navegador e é auto-contido: as capturas de tela estão embutidas nele como data URI, sem pasta de imagens ao lado.

O PDF correspondente fica em `entregas/` e é regerado a partir deste HTML:

```bash
node scripts/build-implementation-summary.mjs
```

## Referências de marca

- `brand/brand-book-a4.pdf`: manual de marca fornecido para o projeto.
- `brand/brand-book-a4.html`: mesma peça em HTML, fonte do PDF acima.
- `brand/design-system.html`: tokens e componentes visuais extraídos da ClickBus.

## Entregáveis

Os documentos finais ficam em `entregas/`, na raiz do repositório:

| Arquivo | O que é |
| --- | --- |
| `Resumo_Implementacao_MVP_ClickBus_Acessivel.pdf` | resumo executivo da implementação |
| `Escopo_Tecnico_MVP_ClickBus_Web.pdf` | escopo técnico elaborado para o MVP |
| `Escopo_Tecnico_MVP_ClickBus_Web.docx` | mesma peça em formato editável |
| `Escopo_Original_ClickBus_MVP.pdf` | escopo recebido no início do projeto |

## Sobre as capturas de tela

As evidências da auditoria dos sites analisados e os conceitos visuais que orientaram a implementação foram removidos do repositório: o que importa deles está registrado nos guias e no resumo executivo. O histórico do Git preserva os arquivos, caso alguém precise recuperá-los.
