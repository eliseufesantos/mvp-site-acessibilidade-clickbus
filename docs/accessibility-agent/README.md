# Agente de acessibilidade ClickBus

Documentação de produto e engenharia para implementação assistida por IA.

- Versão: 2.0.
- Data: 9 de setembro de 2026.
- Status: núcleo e interface implementados; IA real pendente de configuração; adaptador Rybená demonstrativo implementado, com domínio/token ainda não autorizado.
- Nome de trabalho: ClickAccess. Não pressupõe aprovação de nome ou identidade pela ClickBus.
- Canal do MVP: réplica web existente neste repositório.

## Decisão de produto

Construir um plugin de acessibilidade com configuração conversacional. A pessoa descreve uma necessidade; o agente interpreta, combina e ajusta ferramentas próprias que modificam a apresentação do site. A Rybená fornece exclusivamente a tradução e o player de Libras.

O produto não realiza compra conversacional, busca passagens, escolhe assentos nem substitui a jornada. Não implementar as propostas anteriores de assistente comercial ou interface alternativa de compra.

## Parceria confirmada e acesso técnico pendente

O responsável pelo projeto informou autorização da Rybená para uso gratuito do serviço de Libras, condicionada à divulgação do trabalho da empresa. A autorização é uma decisão resolvida. A documentação pública fornece o CDN e a API; o teste em `127.0.0.1` foi recusado pela Rybená como “Token Rybená não autorizado”, portanto ainda falta liberar o domínio de demonstração ou fornecer o token aplicável.

O crédito e o link estão visíveis no painel. O script só é carregado após clique explícito, com `mode=api` e `doNotTrack="true"`. Falha de autorização é apresentada como falha; nenhuma tradução é simulada.

## Ordem de leitura

1. [PRD](PRD.md): problema, público, escopo, requisitos e métricas.
2. [SDD](SDD.md): arquitetura, contratos, execução, persistência e integração.
3. [Plano de implementação com IA](IMPLEMENTATION.md): entregas incrementais e instruções de execução.
4. [Validação](VALIDATION.md): casos, avaliação do modelo e critérios de conclusão.
5. [Design](DESIGN.md): regras visuais, tokens e inventário de implementação do painel.

Precedência: instruções atuais do usuário → PRD → contratos do SDD → plano de implementação. Se dois documentos se contradisserem, registrar a divergência e corrigir a documentação antes de alterar o comportamento afetado.

## Como iniciar outra sessão de desenvolvimento

Use este texto como pedido inicial, ajustando a etapa desejada:

> Implemente a próxima etapa pendente de `docs/accessibility-agent/IMPLEMENTATION.md`. Leia o PRD, o SDD e os casos de validação relacionados. Inspecione o código atual e preserve alterações existentes. Trabalhe em uma etapa verificável por vez. A autorização gratuita da Rybená está resolvida e o crédito público é obrigatório. O agente só configura acessibilidade e controla Libras; não executa operações de compra. Não use ferramentas visuais da Rybená para implementar as ferramentas próprias. Faça os testes pertinentes, atualize o registro de entrega e informe limitações reais. Não trate respostas simuladas como integração real com IA ou com a Rybená.

## Fontes e contexto

- [Arquitetura atual](../guides/01-ARQUITETURA.md).
- [Acessibilidade implementada e limites atuais](../guides/03-ACESSIBILIDADE.md).
- [Design system atual](../guides/02-DESIGN-SYSTEM.md).
- [Validação atual](VALIDATION.md): matriz, resultados observados e limitações.
- Pesquisa anterior: `docs/Pesquisa_Rybena_FIAP.docx`. Propostas de produto nesse relatório são históricas; esta especificação define a direção atual.

Os módulos descritos no SDD existem nesta entrega. O registro em `IMPLEMENTATION.md` distingue estrutura concluída de integrações externas ainda não validadas.
