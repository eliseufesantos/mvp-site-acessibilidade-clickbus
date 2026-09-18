# Mapeamento ClickBus × réplica FIAP

> **Registro histórico (08/09/2026):** este mapeamento descreve uma versão anterior da réplica. Os anexos E01–E30 foram removidos em 16/09/2026 durante a limpeza documental; seus códigos permanecem apenas como marcadores da auditoria original. Para o estado validado atual, consulte [VALIDATION.md](../accessibility-agent/VALIDATION.md).

Observação em **08/09/2026**, fuso America/Sao_Paulo. Entrega documental; nenhuma mudança no código da aplicação. Base Git inspecionada: `4f2eff0278a564977091933daa82c8a07652feef`.

## Resumo executivo

A réplica já oferece uma base aproveitável em React/TypeScript/Vite: cinco etapas, componentes de botão/switch/progresso, tokens de apresentação, foco no conteúdo ao navegar e validação local do passageiro. Não é necessário reconstruir toda a aplicação.

A maior distância está na hierarquia da home e dos resultados. No site público, a home apresenta campanha, formulário compacto e ofertas; a réplica destaca benefícios do próprio MVP. Os resultados reais combinam busca no cabeçalho, dias adjacentes, filtros, ordenação, terminais, serviços e itinerário. O mapa observado abre sobre os resultados; a réplica usa uma página com resumo e mapa simplificado.

Antes de integrar o produto, corrigir a coerência dos dados e a base de interação: datas fixas, rotas que não correspondem aos cartões, classificação de assentos, contagem de lugares, nome acessível do acionador mobile e retorno de foco do painel. Separar escala, espaçamento e controles, atualmente agrupados em “Modo idoso”. A migração para Rybená segue o PRD/SDD já existente; sua autorização gratuita e atribuição obrigatória estão resolvidas.

## Recorte recomendado para a demonstração

**Home → busca de ida → resultados → itinerário → assentos fictícios.** Usar São Paulo → Rio de Janeiro como cenário principal, com data futura calculada e dados locais coerentes. Mostrar ajustes, refinamento e desfazer; traduzir uma instrução pública explicitamente escolhida. Um formulário de passageiro vazio, com erros locais, pode complementar a demonstração de semântica. Não é necessário simular pagamento para provar o produto de acessibilidade.

A volta é uma diferença observada, mas sua jornada completa não foi verificada. Implementá-la só depois do recorte principal, sem adicionar um controle que prometa um fluxo inexistente. Preservar a confirmação simulada já existente como regressão futura, sem apresentá-la como réplica verificada do checkout real.

## Ordem de leitura

1. [Mapa de telas](MAPA-DE-TELAS.md): acessos, estados, componentes, comportamento e limites.
2. [Análise de diferenças](GAP-ANALYSIS.md): matriz priorizada e arquivos envolvidos.
3. [Acessibilidade e conteúdo](ACESSIBILIDADE-E-CONTEUDO.md): contratos do hospedeiro, alvos públicos e exclusões.
4. [Plano de reconstrução](PLANO-DE-RECONSTRUCAO.md): entregas incrementais e critérios de aceite.

## Método e alcance

- Site oficial: [ClickBus](https://www.clickbus.com.br/), navegador integrado do Codex, sessão sem autenticação.
- Réplica: `http://127.0.0.1:4173/`, servida a partir do código existente com Vite. Todas as etapas compartilham esse caminho; mudam por estado React.
- Viewports solicitadas e usadas: **1440 × 900 CSS px** e **390 × 844 CSS px**. Redimensionamento de navegador desktop, sem emulação de dispositivo físico, toque ou teclado virtual.
- A auditoria original combinou captura visual, árvore acessível/DOM, algumas ações de teclado e inspeção do código. Não foram executados NVDA/VoiceOver, axe, Lighthouse ou auditoria WCAG integral.
- Algumas imagens originais foram exportadas em dimensões diferentes da viewport CSS. Os anexos brutos foram removidos; as conclusões preservadas não devem ser usadas para medir pixels ou representar a interface atual.
- Preços, campanhas, quantidade de resultados e lugares são retratos do momento. Não são regras permanentes nem dados a copiar para o mock.

## Convenções de evidência

| Marca | Significado |
| --- | --- |
| **O-V** | Observado diretamente no navegador, incluindo estado acessível/DOM e ações descritas |
| **O-C** | Observado diretamente no código local; não equivale a teste de execução |
| **I** | Inferência ou proposta de implementação, com justificativa indicada |
| **NV** | Não verificado; não deve ser tratado como comportamento conhecido |

Os identificadores E01–E30 eram os prefixos dos anexos removidos. Permanecem apenas como marcadores históricos nas descrições abaixo. Recomendações são propostas, não mudanças já entregues.

## Limitações e fronteira comercial

Foram observados busca, sugestões, calendário desktop, resultados, ordenação por preço, filtro de manhã, itinerário e mapa real **sem selecionar poltrona**. Não foram realizados compra, pagamento, login, cadastro, preenchimento de dados pessoais, aceite de termos ou comunicação externa. A abertura do mapa foi apenas consultiva; nenhuma seleção, reserva ou compromisso foi acionado.

O fluxo real depois da escolha de um assento permanece **NV**: não há evidência de checkout, pagamento, confirmação, preços finais ou instante exato em que o fornecedor bloqueia inventário. Nenhum CAPTCHA apareceu nas telas percorridas. Isso não significa que etapas posteriores sejam livres de restrições.

O calendário mobile expôs um campo nativo de data no DOM; seu seletor do sistema não foi capturado. Uma tentativa de Enter no calendário desktop levou a resultados para 09/09, sem comprovar a data pretendida de 15/09: não usar esse ensaio como validação de seleção por teclado.

## Preservação do trabalho existente

Foram lidos os cinco documentos solicitados, guias de arquitetura/design/acessibilidade/dados e o código relevante. Nenhum `AGENTS.md` foi encontrado nos diretórios de projeto e ancestrais pesquisados. Permaneceram intocados: alterações prévias de `docs/README.md`, `docs/guides/00-CONTINUAR-PROJETO.md`, `.research/`, `docs/Pesquisa_Rybena_FIAP.docx` e `docs/accessibility-agent/`.

As preferências locais encontradas eram contraste e modo idoso ligados, Libras ligada e redução de movimento desligada. Foram temporariamente ajustadas pela UI para comparação e restauradas ao final; a jornada de teste foi reiniciada. Não foram instaladas dependências nem alterados arquivos da aplicação.
