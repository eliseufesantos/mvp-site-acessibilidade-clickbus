# Registro de interações e observações técnicas

Data: 08/09/2026, America/Sao_Paulo. Registro manual contemporâneo das ações de navegador e da inspeção de código. Horários de capturas no [manifesto](capturas.json). O registro não é replay automatizado nem prova de leitor de tela.

## Site real

| Sequência | Ação e resultado efetivamente observado | Evidência / limite |
| --- | --- | --- |
| 1 | Abrir home; configurar 1440 × 900. DOM inicial mostrava busca de ofertas, depois cards | E01. `innerWidth=1440`, `innerHeight=900`, DPR=1 medidos no início; captura final refeita para nitidez |
| 2 | Buscar sem campos | E02. Rótulos de origem/destino mudam para instruções; botão permanece ativo; não navegou |
| 3 | Digitar São Paulo em Origem; lista com TODOS e terminais | E03. Geolocalização não acionada |
| 4 | ArrowDown + Enter em Origem | Lista continuou aberta, texto São Paulo permaneceu; seleção por teclado não confirmada |
| 5 | Clicar opção São Paulo TODOS | Destino recebeu foco e mostrou sugestões |
| 6 | Clicar Rio de Janeiro TODOS | Ida recebeu foco; calendário desktop abriu com setembro/outubro |
| 7 | Acionar Enter direcionado ao botão de 15/09 | Resultado inesperado: chegou à rota sem query de data, cabeçalho 09/09. Não é evidência de seleção bem-sucedida de 15/09 |
| 8 | Ler resultados sem filtro | E05. 224 resultados mostrados, primeira partida 00:02 por R$159,90. Cupom promocional sobre a lista |
| 9 | Recolher cupom por Coupon menu; clicar Preço | E06. Primeira opção mudou para Rio Doce 10:00 por R$108,99; não copiado cupom |
| 10 | Clicar texto Manhã | Não houve mudança identificável; inspeção do DOM mostrou label separado do checkbox |
| 11 | Abrir Ver itinerário da primeira opção | E07. Embarque/desembarque, endereços e duração carregaram depois do diálogo |
| 12 | Pressionar Escape no itinerário | Snapshot imediato ainda continha diálogo; observação seguinte confirmou fechamento. Retorno de foco não medido |
| 13 | Acionar quadrado do filtro Manhã pelo controle identificado | E08. Filtro ativo e Remover filtros apareceram; cartões mudaram. Contador permaneceu 224 |
| 14 | Reabrir itinerário; clicar Escolher assento | E09. Abriu mapa em diálogo com iframe; nenhuma poltrona foi clicada |
| 15 | Alterar para 390 × 844 | E10. Primeiro frame após resize descartado e recapturado; mapa mobile e detalhes inferiores visíveis |
| 16 | Escape no mapa | Retorno aos resultados observado; E11 mantém Manhã e preço |
| 17 | Abrir Filtrar no mobile | E12. Ordenação, grupos e botões Limpar/Aplicar no DOM; aplicação mobile não exercitada |
| 18 | Retornar à home; interrupção/continuação da sessão exigiu nova aba da mesma página | E13. Não se perdeu nenhuma seleção comercial; nenhuma havia sido feita |
| 19 | Habilitar Ida e Volta; clicar Data de ida no mobile | E14. Retorno habilitado; input nativo type=date focado. Pop-up nativo não capturado |
| 20 | Refazer home desktop sem erro para nitidez | E01 atualizada; Noto Sans e h1 de 20px medidos por estilo computado; CTA roxo rgb(165,40,255) |

Nota sobre teclado real: a tentativa de clicar Escolher assento logo após Escape falhou por ausência do botão, confirmando que o diálogo anterior havia fechado. Foi feito novo acesso explícito pelo detalhe. Não houve seleção de assento, navegação a checkout, login, pagamento, aceite ou envio de dados pessoais.

## Réplica local

| Sequência | Ação e resultado observado | Evidência / código |
| --- | --- | --- |
| 1 | Abrir aplicação local; painel revelou contraste=true, idoso=true, Libras=true, movimento=false | Preferências prévias, sem inferir dados pessoais |
| 2 | Desligar contraste/idoso pela UI para comparar tema padrão | E15–E27, exceto registros textuais E29/E30 posteriores |
| 3 | Preencher data com 09/09 e enviar | E16; data dos resultados fixa. Ensaio separado E26 salva DOM antes/depois para rastreabilidade |
| 4 | Marcar Somente leito | E17. Expresso do Sul Leito-cama e UTIL Semi-leito permanecem |
| 5 | Desmarcar filtro, escolher primeira viagem | E18. Mapa 49–64, três ocupados, treze livres; Continuar desabilitado |
| 6 | A partir do botão 49, ArrowDown | Elemento ativo = Assento 54, livre. Código calcula salto na lista que remove ocupados; posição visual abaixo é 53 |
| 7 | Enter no foco atual | Assento 54 selecionado, aria-pressed e status presentes, Continuar habilitado. Somente mock local |
| 8 | Continuar | E19. Formulário vazio, resumo e data fixa; nenhum dado preenchido |
| 9 | Concluir compra com formulário vazio e termos desmarcados | E20. Quatro erros; elemento ativo é `.error-summary`, role=alert, tabindex=-1. Nenhuma conclusão ocorreu |
| 10 | Redimensionar a 390 × 844 e voltar aos assentos | E21–E23. Resumo fica antes do mapa; Tab de 49 leva a 50. Captura do mapa feita após estabilizar rolagem |
| 11 | Voltar aos resultados e busca | E24–E25. Filtros inline; primeiro cartão abaixo da primeira dobra |
| 12 | Preencher 09/09, observar DOM, Tab e enviar | E26 antes/depois. Campo mostra 2026-09-09; resultado mostra 30 de agosto. Não foi usado para afirmar que o estado React interno reteve a nova data |
| 13 | Abrir painel mobile | E27. Botão sem nome acessível; rótulo ocultado por display:none; região do painel existe |
| 14 | Focar switch, Tab, Escape | Após fechar, `document.activeElement.tagName=BODY`, sem classe ou aria-label. Não houve retorno ao acionador |
| 15 | Reabrir, ligar contraste/idoso | E28. Preferências originais restauradas; acionador passa a se chamar apenas 2 no snapshot mobile |
| 16 | Medir painel ampliado | `left=-9`, `top=80`, `width=366`, `height≈692.03`, `bottom≈772.03`; viewport 390×844; overflow=visible |
| 17 | Buscar `zzzz` na origem | E29. Lista informa ausência; `aria-activedescendant=:r23:-0`, mas elemento não existe |
| 18 | Sequência de edição/teclas permite envio com `zzzz` ainda no estado da busca | E30. Origem zzzz no resumo, horários/cidades dos cartões continuam fixos. Não usar esse ensaio como diagnóstico completo dos handlers de teclado |
| 19 | Recarregar réplica | Formulário voltou aos valores iniciais; contraste/idoso/Libras ligados e movimento desligado preservados. Abas criadas para auditoria encerradas |

## Inspeção de código que complementa as capturas

- `App.tsx`: estados locais, foco no main, sem roteador por URL; fonte inicial da data é constante.
- `ResultsPage.tsx`: data/cidades constantes, substring de classe; nenhum conjunto atual de filtros zera a primeira viagem.
- `SeatSelectionPage.tsx`: mapa global constante; três ocupados; setas indexam somente disponíveis.
- `CheckoutPage.tsx`: erros locais; onComplete muda etapa sem rede; CPF/nascimento validados só por comprimento/formato.
- `Header.tsx` e CSS: fechamento global por Escape sem ref de retorno; texto do acionador oculto no mobile; hashes secundários sem destinos.
- `useAccessibilityPreferences.ts`: leitura tem try/catch; escrita não; valores parcialmente coercivos; Libras ligada por padrão.
- `LocationCombobox.tsx` e `signLibras.ts`: envio automático da opção ativa após 250ms a API opcional não documentada do legado.
- CSS: tokens reutilizáveis, foco visível de 3px, breakpoints 1040/820/640; preferência de movimento do sistema trata apenas scroll na media query; atributo manual trata animações/transições.

## Limites técnicos das capturas

Alguns primeiros frames após resize mostraram composição incorreta e foram substituídos. As imagens finais foram abertas/emitidas e inspecionadas. Arquivos PNG são os bytes retornados pelo capturador, sem montagem ou edição. O índice distingue viewport CSS e bitmap exportado. A árvore completa pode incluir conteúdo fora da viewport, itens recolhidos ou estado de transição; use a imagem para aparência e o relato acima para ações, sem confundir existência no DOM com visibilidade.

O site real usa componentes e campanhas dinâmicos. A reabertura da home alterou parte das ofertas; isso não foi tratado como mudança de regra. O relatório não mede latência, disponibilidade, desempenho ou qualidade linguística.
