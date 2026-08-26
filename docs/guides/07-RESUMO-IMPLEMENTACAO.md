# Resumo da implementação do MVP acessível

## Objetivo

O projeto recria a jornada principal de compra da ClickBus em um protótipo acadêmico, priorizando melhorias de acessibilidade de baixo custo, alto retorno e resultado visual evidente.

## O que foi implementado

- busca de origem, destino e data;
- lista de viagens fictícias com filtros rápidos;
- seleção de assento em mapa simplificado;
- formulário de passageiro com validação acessível;
- confirmação acadêmica sem pagamento;
- alto contraste, modo idoso e redução de movimento;
- navegação por teclado, foco visível e estrutura semântica;
- persistência local das preferências visuais;
- layout responsivo para desktop e mobile.

## Justificativas principais

### Alto contraste

Troca os tokens da interface por preto, branco e amarelo. É uma alteração de baixo custo técnico, aplicada globalmente por CSS, que produz ganho visual imediato para pessoas com baixa visão ou sensibilidade a baixo contraste.

### Modo idoso

Amplia tipografia, controles e espaçamentos e remove conteúdo secundário. A solução reduz esforço visual e motor sem criar uma jornada separada ou exigir identificação de idade.

### Fluxo linear

A jornada foi organizada em três etapas visíveis - viagem, assento e passageiro. Isso diminui a carga cognitiva e deixa claro o que já foi concluído e o que falta.

### Validação acessível

Os erros são agrupados, associados aos campos e removidos após a correção. Isso evita mensagens genéricas e reduz retrabalho durante o preenchimento.

### Simulação sem backend

Dados, preços e horários são locais e fictícios. Essa decisão mantém o projeto seguro, demonstrável e coerente com o escopo acadêmico, sem custo de integração ou risco de processar dados reais.

## Resultado

O MVP demonstra que ajustes concentrados em tokens visuais, semântica, foco e simplificação de conteúdo podem melhorar significativamente a percepção de acessibilidade sem reconstruir toda a plataforma.

O protótipo passou por typecheck, build de produção e teste manual da jornada completa em 1440 x 900 e 390 x 844, sem erros no console e sem overflow horizontal no mobile.
