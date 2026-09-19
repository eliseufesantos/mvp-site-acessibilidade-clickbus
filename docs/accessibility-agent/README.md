# Agente de acessibilidade ClickBus

Documentação de produto e engenharia para implementação assistida por IA.

- Versão: 2.0.
- Data: 9 de setembro de 2026.
- Status: núcleo e interface implementados; adaptador Gemini e proteções locais implementados e testados com transporte falso, mas chamada real ainda `NOT RUN` por ausência de segredo no runtime; token temporário Rybená vinculado ao domínio autorizado recebido, com handler/URL e contrato do adaptador validados localmente, enquanto fetch no navegador, injeção da tag, CDN/player, configuração Vercel, deploy e smoke seguem `NOT RUN`.
- Nome de trabalho: ClickAccess. Não pressupõe aprovação de nome ou identidade pela ClickBus.
- Canal do MVP: réplica web existente neste repositório.

## Decisão de produto

Construir um plugin de acessibilidade com configuração conversacional. A pessoa descreve uma necessidade; o agente interpreta, combina e ajusta ferramentas próprias que modificam a apresentação do site. A Rybená fornece exclusivamente a tradução e o player de Libras.

O produto não realiza compra conversacional, busca passagens, escolhe assentos nem substitui a jornada. Não implementar as propostas anteriores de assistente comercial ou interface alternativa de compra.

## Parceria e acesso técnico confirmados; validação pendente

O responsável pelo projeto informou autorização da Rybená para uso gratuito do serviço de Libras, condicionada à divulgação do trabalho da empresa. A autorização é uma decisão resolvida e um token temporário vinculado ao domínio autorizado foi recebido fora do repositório. O teste histórico em `127.0.0.1` foi recusado e pode continuar assim porque localhost não é o domínio vinculado. `RYBENA_ACCESS_TOKEN` ainda não foi configurada na Vercel; deploy e smoke real permanecem `NOT RUN`.

O crédito e o link estão visíveis no painel. Após clique explícito, o loader consulta `GET /api/accessibility/rybena`; a função responde `no-store`/CORP same-origin com a URL validada do CDN em `mode=api` e `doNotTrack=true`, ou `503` sem configuração. Com credencial, somente HTTPS em `mvp-site-acessibilidade-clickbus-lovat.vercel.app` é aceito; aliases e previews são recusados. O fetch expira em 10 s, e download, preparação e espera do runtime em 15 s por etapa; tag sem os globals esperados é removida para permitir retry manual. Essas etapas do navegador permanecem `NOT RUN`. Falhas são apresentadas como falhas e nenhuma tradução é simulada.

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
