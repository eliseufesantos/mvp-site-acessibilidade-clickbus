# Mapa de telas, estados e interações

Data: 08/09/2026. Documento histórico; convenções O-V/O-C/I/NV e metodologia no [README](README.md). Os anexos brutos foram removidos, e os códigos E01–E30 permanecem apenas como marcadores da auditoria original. Desktop D = 1440 × 900; mobile M = 390 × 844 CSS px.

## 1. Jornada efetivamente observada

```text
Site real
Home → sugestões de origem/destino → calendário → resultados
  → ordenar por preço / filtrar manhã → itinerário → abrir mapa de assentos
  → PARADA: nenhuma poltrona acionada; etapas posteriores não verificadas

Réplica
search → results → seats → checkout vazio → erros de validação
                           └─ seleção fictícia e navegação por teclado
confirmation: implementação inspecionada, não percorrida nesta execução
```

No real, resultados e seus detalhes mantiveram o caminho `/onibus/sao-paulo-sp-todos/rio-de-janeiro-rj-todos`; os links de dias adjacentes incluem `?departureDate=YYYY-MM-DD`. A data efetivamente mostrada no percurso foi **09/09/2026**. O mapa carrega conteúdo em iframe dentro de diálogo. Não há motivo para reproduzir essa separação técnica na réplica.

## 2. R01 — Home e formulário

**Acesso:** [home oficial](https://www.clickbus.com.br/). **O-V:** E01–E04, E13–E14. **Réplica:** E15, E25; `SearchPage.tsx`, `LocationCombobox.tsx`, `Header.tsx`.

Objetivo: definir trajeto e data para consultar passagens. No desktop, a ordem visual é cabeçalho → campanha horizontal → cartão branco sobre a campanha → ofertas. O título da busca fica dentro do cartão. Origem, destino, ida e volta formam um conjunto compacto; a troca de cidades aparece entre origem/destino. Há seleção de somente ida ou ida e volta, com retorno inicialmente desabilitado, e botão “Buscar”. Nenhum campo de quantidade de passageiros foi observado nesse formulário.

O cabeçalho desktop contém logo, clube, ofertas, pedidos, ajuda, explorar e entrada de conta. Na versão mobile, há logo, entrada de conta e menu. Abaixo da busca foram identificados ofertas, chamadas de app/clube, principais passagens, rotas, texto institucional e rodapé. Só a porção inicial teve comparação visual detalhada; os blocos inferiores foram inventariados no DOM, sem testar cada link.

No mobile, a arte muda de proporção e o formulário empilha origem/destino; o controle de troca fica junto à borda direita dos campos. A escolha ida/volta vem abaixo deles. Datas compartilham uma linha e o CTA ocupa a largura. A home local, por comparação, gasta mais altura com título e texto sobre o MVP, adiciona uma linha inteira para a troca e só oferece uma data.

### R01a — Validação sem dados

**O-V, E02:** clicar Buscar sem preencher não navegou. Os rótulos de origem/destino passaram a instruções de seleção, em vermelho. O foco permaneceu no botão no snapshot. Não foi verificado anúncio por leitor de tela, associação programática dos erros ou todos os casos de data inválida.

**O-C, réplica:** inputs `required`; comparação exata bloqueia cidades iguais com mensagem de erro. Não há validação de cidade contra o catálogo; data mínima e inicial são constantes de agosto. O texto de erro de busca não tem `role=alert` nem vínculo explícito com os campos.

### R01b — Sugestões e foco

**O-V, E03:** digitar São Paulo oferece “TODOS”, Tietê, Barra Funda, Shopping Metrô Itaquera e Jabaquara; distingue cidade inteira de pontos de embarque. “Usar minha localização” apareceu, mas não foi acionado. Ao selecionar São Paulo por clique, o foco passou para Destino; ao escolher Rio de Janeiro, passou para Ida e abriu calendário.

Na tentativa de ArrowDown + Enter em Origem, o valor continuou como texto digitado e a lista permaneceu aberta. O DOM expôs sugestões como elementos genéricos; isso limita a conclusão sobre operabilidade. Não generalizar para todo navegador nem reproduzir esse padrão na réplica.

**O-C:** combobox local reaproveitável, seis cidades, `role=combobox`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, lista de opções e handlers de setas/Enter/Escape. **O-V, E29:** consulta `zzzz` mostrou lista vazia, mas o `aria-activedescendant` apontou para um ID inexistente. **O-V, E30:** foi possível chegar a resultados com `zzzz` como origem e cartões ainda de São Paulo para Rio; não é um cenário coerente para demonstração.

### R01c — Datas e ida/volta

**O-V, E04:** calendário desktop mostra setembro e outubro de 2026 lado a lado, controles de mês, dias e Limpar. Dias anteriores ao momento da consulta não eram botões nessa vista. Nomes acessíveis dos dias/navegação foram expostos em inglês.

Uma ação de Enter direcionada ao dia 15 resultou em navegação para uma lista cuja data era 09/09, sem parâmetro de data na URL. Causa **NV**; pode envolver comportamento do formulário ou ferramenta. A seleção desejada não foi validada. O percurso subsequente está documentado como 09/09, sem corrigir retrospectivamente a evidência.

**O-V, E14:** escolher ida e volta habilitou o campo de retorno. No mobile, o DOM mostrou um `input type=date` sobreposto ao campo visual; o seletor nativo não ficou visível na captura. Não houve consulta de ida e volta nem verificação de restrições entre suas datas.

## 3. R02 — Resultados, ordenação e filtros

**Acesso:** [rota consultada](https://www.clickbus.com.br/onibus/sao-paulo-sp-todos/rio-de-janeiro-rj-todos). **O-V:** E05, E06, E08, E11, E12. **Réplica:** E16, E17, E24, E26.

Objetivo: comparar viagens e serviços. Desktop real: busca condensada no cabeçalho; faixa de rota/inversão; breadcrumb e campanha; progresso “Selecionar viagem / Pagar / Confirmar”; dias adjacentes; filtros laterais; barra de quantidade/ordenação; cartões.

Filtros inventariados: saída por período, passagens com benefícios, tipo de assento, origem, destino e companhia. Tipos: Convencional, Executivo, Semi-leito, Leito e Cama. Benefícios aparecem com menção a pessoas idosas, Passe Livre e ID Jovem; regras de elegibilidade não foram examinadas. Não modelar legislação a partir do rótulo.

Ordenações visíveis: preço, duração, horário de saída. **O-V:** preço mudou o primeiro cartão de uma partida 00:02 por R$159,90 para Rio Doce às 10:00 por R$108,99. Valores apenas identificam o ensaio. Duração e horário foram inventariados, mas não exercitados separadamente.

**O-V, E08:** clicar o quadrado do filtro Manhã alterou os cartões e mostrou “Seus filtros” / “Remover filtros”. Clicar apenas o texto Manhã não havia alterado a lista. O contador continuou em 224 no snapshot filtrado; não assumir que representa a quantidade filtrada. Não testada remoção individual nem combinação que produzisse vazio.

### Cartões e variações

Cada cartão observado inclui logotipo/nome da viação, saída/chegada, terminais, duração, classe, comodidades, preço e acesso à seleção. Algumas viagens têm “Ver itinerário”; algumas mostram urgência de poucos lugares. A linha de serviço concentra classe, ícones, preço e botão de seta. Há indicação de passagem no celular/e-mail. O DOM apresentou botões sem nome e um texto alternativo com placeholder não interpolado de inclinação do assento; corrigir esses aspectos na réplica, não copiá-los.

A réplica possui três opções fixas, ícone genérico da viação, horários/cidades em linha, preço à direita e botão “Escolher”. Filtros são dois checkboxes, sem ordenação nem detalhe. “Somente leito” mantém Semi-leito (**E17**). Todos os conjuntos atuais de filtros preservam ao menos a primeira viagem (**O-C**); o estado vazio existe no JSX, mas não é alcançável com os dados atuais.

### Mobile

**O-V, E11–E12:** rota e data ocupam faixas; há “Alterar data” e botão Filtrar com contagem de filtros. Ordenação e grupos de filtros aparecem em diálogo com Limpar/Aplicar no DOM. Os cartões passam a distribuir horários e terminais verticalmente/por extremidades. Aplicação/limpeza pelo diálogo mobile não foi testada; abertura e inventário foram.

Na réplica, resumo, título grande, explicação e filtros ocupam quase toda a primeira viewport; o primeiro cartão só começa no fim de E24. Os filtros permanecem inline. O cabeçalho conserva apenas logo e acionador de acessibilidade, cujo nome desaparece quando o texto é escondido.

A comparação original usou a mesma viewport, mas filtros e dados diferentes; sua conclusão se limita à hierarquia, não à disponibilidade nem à correspondência de cartões.

## 4. R03 — Itinerário

**Acesso:** resultados → Ver itinerário na primeira opção após ordenar por preço. **O-V:** E07; mesma URL da rota.

Diálogo vertical central com título, botão de fechar, horários/datas, pontos de embarque/desembarque, endereços públicos, duração e ressalva de que a viação define e pode mudar o itinerário. Rodapé combina preço e Escolher assento. Escape fechou o diálogo; a árvore imediatamente após a tecla ainda capturou a transição, e a observação seguinte confirmou seu desaparecimento. Retorno de foco e contenção completa de Tab: **NV**.

**Réplica O-C:** não há componente de detalhe. **I:** acrescentar diálogo reutilizável, conteúdo fictício coerente e retorno de foco, mantendo a escolha de viagem separada do comando de tradução. A versão mobile específica desse itinerário não foi capturada.

## 5. R04 — Mapa de assentos

**Acesso:** itinerário → Escolher assento. **O-V:** E09–E10. O caminho principal continua o da rota. Dentro do diálogo há iframe da viagem; seu identificador de inventário é efêmero e não serve como seletor de integração.

Desktop: título superior, fechamento, informações/benefícios da viação à esquerda e ônibus vertical à direita, classe e data/horário acima do mapa. Há política de embarque recolhida. Poltronas ocupadas aparecem com X; as livres mostram número. Legenda distingue Livre, Escolhido e Ocupado. Na amostra, só quatro números estavam livres. **Nenhum assento foi selecionado.**

Mobile: mapa primeiro; detalhes da viação em superfície inferior recolhida. A quantidade de fileiras exige rolagem. Cupom flutuante continuou por cima. Estados de assento selecionado, CTA após seleção, bloqueio, timeout, preço total e passagem ao checkout: **NV**. Política de embarque e detalhes inferiores não foram expandidos.

**Réplica O-C/O-V, E18, E22–E23:** página com resumo antes do mapa no mobile; 16 números (49–64), três ocupados, treze livres em todas as viagens. Botões ocupados desabilitados, `aria-label` em português, seleção com `aria-pressed` e `role=status`; Continuar só habilita depois da escolha. O primeiro cartão anuncia 12 livres, divergindo dos 13 do mapa. Na execução, ArrowDown partindo de 49 levou a 54, embora 53 esteja geometricamente abaixo. O algoritmo usa a lista de lugares livres com salto de quatro índices, perdendo a coluna quando há ocupado. Enter selecionou 54 apenas no mock local. Tab de 49 chegou a 50, com foco visível em E23.

## 6. R05 — Passageiro e confirmação

**Site real:** **NV**, fora da fronteira segura desta inspeção. Os nomes Pagar/Confirmar no progresso não comprovam o conteúdo dessas telas.

**Réplica O-V, E19–E21:** formulário vazio com nome, CPF, nascimento e checkbox de termos; resumo de rota/empresa/data/assento/total e Concluir compra. O envio vazio produziu quatro pendências e levou o foco ao resumo de erros. Campos têm mensagens específicas; nenhum dado pessoal foi digitado e os termos não foram aceitos.

**O-C:** valida nome por comprimento, CPF por onze dígitos e nascimento por formato; não são validações completas de documento/data. O clique válido apenas chama `onComplete`. `ConfirmationPage.tsx` mostra confirmação, resumo, retorno ao início e nova busca. Não existe pagamento real, backend de reservas ou geração de bilhete. Essa tela não foi aberta nesta execução.

## 7. R06 — Acessibilidade existente

**Réplica O-V/O-C, E27–E28:** popover no cabeçalho com contraste, modo idoso, Libras e redução de animações. No mobile sem modos ativos, o botão aparece sem nome; com dois ativos, o nome se reduz a “2”. Escape fecha, mas após foco interno o elemento ativo foi BODY. Com contraste e ampliação, o painel mediu `left=-9`, `width=366`, `bottom≈772` em viewport 390 × 844, indicando recorte horizontal. O botão externo VLibras sobrepõe conteúdo da página e do painel nas capturas.

A preferência legada carrega VLibras; nenhuma chamada real de IA ou integração Rybená existe no código inspecionado. Não se verificou a qualidade de tradução do VLibras nem se abriu seu player. A especificação nova não é descrição do estado implementado.

## 8. Estados não cobertos e evidência de carregamento

| Estado | Cobertura |
| --- | --- |
| Home carregando ofertas | O-V no DOM inicial: mensagem de busca de ofertas; depois cartões. Sem medição de tempo |
| Itinerário carregando | O-V: diálogo inicialmente sem conteúdo, depois trajeto. Captura final aceita |
| Mapa carregando | Texto residual “Carregando...” no DOM externo coexistiu com mapa pronto; não chamar a tela inteira de bloqueada |
| Origem não encontrada no real | NV; vazio só exercitado na réplica |
| Resultados vazios/erro de rede real | NV; não provocados |
| Validação completa de datas, retorno e troca de cidades real | NV; controles inventariados e retorno habilitado, sem todas as combinações |
| Teclado integral e leitor de tela | NV; testes pontuais não equivalem a jornada integral |
| Zoom 200%, 320 CSS px, teclado virtual, toque | NV; critérios para próxima implementação |
| Reserva/pagamento/autenticação | Não realizados |

## 9. Inventário técnico reutilizável

| Área | Arquivos existentes e responsabilidade |
| --- | --- |
| Navegação/estado | [App.tsx](../../app/src/app/App.tsx): cinco estados, busca/viagem/assento, título/foco; [types.ts](../../app/src/types.ts): contratos atuais |
| Entrada | [SearchPage.tsx](../../app/src/features/search/SearchPage.tsx), [LocationCombobox.tsx](../../app/src/features/search/LocationCombobox.tsx) |
| Lista | [ResultsPage.tsx](../../app/src/features/results/ResultsPage.tsx), [trips.ts](../../app/src/data/trips.ts) |
| Assentos e formulário | [SeatSelectionPage.tsx](../../app/src/features/seats/SeatSelectionPage.tsx), [CheckoutPage.tsx](../../app/src/features/checkout/CheckoutPage.tsx), [ConfirmationPage.tsx](../../app/src/features/confirmation/ConfirmationPage.tsx) |
| Compartilhados | [Button.tsx](../../app/src/components/ui/Button.tsx), [Switch.tsx](../../app/src/components/ui/Switch.tsx), [StepProgress.tsx](../../app/src/components/ui/StepProgress.tsx), [Header.tsx](../../app/src/components/layout/Header.tsx), [ClickBusLogo.tsx](../../app/src/components/brand/ClickBusLogo.tsx) |
| Apresentação | [tokens.css](../../app/src/styles/tokens.css): cores, largura 1180, controle 48/56, raios 8/12/20; [global.css](../../app/src/styles/global.css): base, foco, movimento; [components.css](../../app/src/styles/components.css): layouts e breakpoints 1040/820/640 |
| Preferências e Libras | [hook](../../app/src/hooks/useAccessibilityPreferences.ts), [host do plugin](../../app/src/components/accessibility/AccessibilityPlugin.tsx), [painel](../../app/src/components/accessibility/AccessibilityPanel.tsx), [contratos de Libras](../../app/src/features/accessibility-agent/adapters/libras/contracts.ts), [adaptador Rybená](../../app/src/features/accessibility-agent/adapters/libras/rybenaBrowser.ts) |

Tipografia local: Rubik e Roboto Mono. **O-V**, amostra de estilos computados nos resultados reais: Noto Sans, CTA Buscar 14px, roxo `rgb(165,40,255)`. Não foi extraído um design system completo do site. O roxo principal já coincide com o token local; tipografia, raios, densidade e hierarquia merecem ajuste localizado.
