# Resumo da implementação — Acessibilidade Assistida por IA

## Resultado

A réplica ClickBus preserva a jornada fictícia e ganhou um plugin de acessibilidade em três áreas: conversa, ajustes e conteúdo. O núcleo é determinístico, reversível e funcional sem serviços externos.

## Núcleo entregue

- preferências v3 independentes, migração v1/v2 e fallback em memória;
- 13 campos de preferência, preset, restauração, no-op e desfazer;
- contratos runtime fechados para planejamento, explicação e simplificação;
- executor com revisão, página/sessão, capacidades, pré-validação, idempotência e recibos;
- frontend com timeout de 12 s, cancelamento e sem retry automático;
- backend configurável somente por variáveis de servidor;
- glossário local e registro estático de conteúdo público;
- voz opcional, explícita e editável;
- painel responsivo, foco visível, diálogo mobile e rolagem controlada;
- suíte de 11 testes, TypeScript e build aprovados.

## IA

O modelo é apenas planejador: não gera CSS/JS, não navega, não compra e não recebe ferramentas comerciais. Sem endpoint, modelo e chave explicitamente configurados, o backend devolve 503. Portanto, inferência real e simplificação gerada estão preparadas, mas não validadas.

## Rybená

A autorização de uso gratuito está confirmada. O crédito “Tradução em Libras por Rybená” está visível. Como a API/SDK/player e o contrato técnico não foram disponibilizados, o adaptador permanece no estado `unavailable_pending_provider_configuration`, sem rede e sem falso sucesso.

## Segurança e privacidade

- nenhuma chave no frontend;
- histórico curto apenas em memória;
- nenhum DOM, screenshot ou formulário da jornada enviado ao planejador;
- explicação/simplificação restritas a IDs públicos;
- checkout e confirmação excluídos;
- nenhuma operação de compra, reserva, cancelamento ou pagamento no contrato.

## Próximas validações

Configurar um provedor real com proteção de custo, executar a matriz semântica do planejador, receber o contrato técnico da Rybená, homologar player/tradução e realizar testes humanos com leitor de tela e pessoas surdas sinalizantes.
