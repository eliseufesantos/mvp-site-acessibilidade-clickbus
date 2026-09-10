# Acessibilidade e conteúdo para integração

08/09/2026. Esta proposta usa o [PRD](../accessibility-agent/PRD.md) e o [SDD](../accessibility-agent/SDD.md) como contratos. O mapeamento não redefine o produto: ferramentas próprias de apresentação/leitura, agente que configura essas ferramentas e Rybená exclusivamente para Libras. A autorização gratuita já está resolvida, condicionada à divulgação.

## 1. Base existente e correções necessárias

**Observado no código:** preferências v1, quatro booleanos, atributos em `html`, controles manuais e VLibras. Não existem IA real, store v2, seletor seguro de trechos, guia ou Rybená. O comentário antigo sobre escolha comercial do VLibras não muda a decisão atual do PRD.

**Observado na execução:** mudança de etapa foca main; seleção local de assento informa estado; envio vazio do checkout foca resumo de erros (E18–E21). No mobile, acionador fica sem nome, painel ultrapassa borda esquerda e Escape não devolve foco (E27–E28). O combobox vazio referencia opção inexistente (E29). São problemas a corrigir antes de atribuir ganhos ao agente.

Não há declaração de conformidade WCAG. A verificação foi pontual, com DOM, teclado e capturas; faltam leitor de tela, avaliação automática, zoom e testes com usuários. Referências de implementação: [padrão combobox W3C](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) e [diálogo modal W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). São orientações para futuras mudanças, não evidência do comportamento da ClickBus.

## 2. Matriz de resposta aos seis ajustes próprios

| Região/componentes | Escala de texto / espaçamento | Contraste / controles grandes | Movimento / guia de leitura | Aceite recomendado |
| --- | --- | --- | --- | --- |
| Header, acionador, navegação | Não depender de texto escondido para nome; quebrar rótulos quando necessário | Logo legível, borda/foco e nome estáveis; alvos sem colisão | Sem deslocamento automático ao abrir; guia segue foco | Acionador localizado e operável por teclado a 390 e 320px |
| Busca, combobox, calendário | Altura flexível; sugestões multilinha, nomes de terminal completos | Erro distinguível por texto/ícone; botões e dias com área suficiente | Sem tradução por foco; evitar scroll suave em movimento reduzido | Lista sem opção ativa inexistente; Enter seleciona, Escape fecha, Tab segue ordem |
| Resumo/dias/filtros | Reduzir colunas conforme reflow; contador e rótulos não cortados | Checkbox nativo ou semântica equivalente com label associado | Atualização anuncia resumo curto; não toda lista a cada ajuste | Ordenar/filtrar não muda busca/assento; foco preservado |
| Cartões/itinerário | Horários, terminais, classe, preço e ressalvas crescem sem truncar | Classes/estado não dependem só de cor; CTA com nome por viagem | Ícones decorativos fora da leitura; detalhes sem animação essencial | Informação mantém sentido em todos os tamanhos e temas |
| Mapa e legenda | Número não reduzido para caber; opção de apresentação adaptável | Livre/ocupado/selecionado por texto/forma/semântica; foco visível | Guia não intercepta poltronas; setas seguem geometria | Tamanho maior não muda números nem escolha; Tab e setas continuam funcionais |
| Checkout | Campos, instruções e erros refluem; resumo abaixo quando necessário | `aria-invalid`, vínculos de erros e total legível | Guia pode orientar leitura local, sem extrair campos | Ajustes visuais locais permitidos; nenhum conteúdo privado enviado |
| Painel próprio | Também responde aos seis ajustes; histórico e botões refluem | Todos os atalhos P0 disponíveis sem IA | Não mover foco a cada mensagem; guia não intercepta clique | Fechar mantém ajustes, cancela pendências e devolve foco |
| Player Rybená | Validar tamanho/controles na versão fornecida | Respeitar limites de interface do fornecedor | Parar/pausar/velocidade refletem estado real | Não prometer que tokens do host alteram iframe/shadow DOM do player |

Implementar as faixas de `textScale`, `readingSpacing`, `controlSize`, `contrast`, `reducedMotion` e `readingGuide` do SDD. Usar unidades relativas e reflow, não `transform:scale()` global. Não ocultar promoções ou conteúdo apenas porque o usuário ampliou texto. Guia com `pointer-events:none`, `aria-hidden` e acompanhamento de foco, além do ponteiro.

## 3. Registro semântico do hospedeiro

**Proposta I:** manter `main-content`, títulos/labels nativos e acrescentar IDs estáveis de região. O plugin recebe metadados e getters de trechos permitidos, não busca seletores na página real nem varre `document.body.innerText`.

| Região proposta | Local provável | Conteúdo registrado para tradução? | Observação |
| --- | --- | --- | --- |
| `search-region` / `search-help` | `SearchPage.tsx` | Apenas instruções estáticas fora do form | Valores digitados são excluídos |
| `results-region` / `results-help` | `ResultsPage.tsx` | Orientação de como comparar/filtrar | Não registrar lista inteira nem consulta pessoal |
| `service-class-help` | Detalhe/cartão proposto | Explicação editorial de classes do mock | Classes por ID; não prometer comodidade pelo nome |
| `trip-details-region` / `itinerary-help` | Diálogo proposto | Trecho estático explicando embarque/desembarque e ressalvas | Separar texto editorial de rota escolhida/valores dinâmicos |
| `seat-map-region` / `seat-map-help` | `SeatSelectionPage.tsx` | Instruções e legenda textual | Não registrar seleção do usuário nem mapa inteiro |
| `boarding-help` | Detalhes/assentos propostos | Instrução própria revisada para demonstração | Política real recolhida não foi lida; não copiá-la por hipótese |
| `passenger-region` | `CheckoutPage.tsx` | **Não** registrar a região | Labels/erros estáticos, se necessários depois, devem morar em bloco separado revisado |
| `confirmation-region` | `ConfirmationPage.tsx` | **Não** | Bilhete, reserva e dados da viagem ficam fora |
| `accessibility-panel` | `Header.tsx` e futuro painel | Não registrar conversa | Identificador de painel não é permissão de extração |

Os IDs são novos contratos propostos; não existem todos no repositório. Para itens repetidos, usar ID do dado local, como `trip-{id}`, para associação semântica e testes, sem tornar automaticamente traduzível toda a região.

Conforme o SDD, o host publica `getCapabilities`, `getPageEpoch`, `getContentTargets`, `resolveContent` e aplicação de preferências. Toda mudança de etapa ou substituição dos alvos invalida a seleção anterior. Uma região oculta ou de outra página não é alvo válido. O registro aceita somente conteúdo revisado, com rótulo curto e getter local.

## 4. Conteúdos candidatos e exemplos

Estes textos são **propostas editoriais para o mock**, não transcrições nem regras comerciais da ClickBus. Manter original visível. Traduzir somente após escolha explícita por lista acessível ou seleção dentro do bloco autorizado.

| ID / conteúdo | Texto-base proposto | Valor para demonstração |
| --- | --- | --- |
| `search-help` | “Escolha a cidade de saída, o destino e a data. Se houver mais de um terminal, confira o local antes de buscar.” | Instrução curta, pública e reutilizável |
| `results-help` | “Compare os horários e o local de embarque. Use os filtros para reduzir a lista e a ordenação para mudar a sequência das viagens.” | Demonstra leitura sem substituir busca |
| `seat-map-help` | “Os lugares disponíveis mostram um número. Escolha um deles. Os lugares ocupados não podem ser selecionados. Você pode navegar com Tab.” | É verificável no mock; só mencionar setas depois de corrigidas |
| `itinerary-help` | “Embarque é o ponto onde você entra no ônibus. Desembarque é onde você sai. Confira os locais e os horários da viagem.” | Explicação contextual sem inferência de tarifa |
| `service-class-help` | “A classe descreve o tipo de serviço da viagem. Consulte as comodidades informadas para essa opção.” | Evita inventar padrão universal de reclinação/serviço |

Começar com 2–3 blocos, não com tradução de toda a página. Limite P0 do SDD: 1.500 caracteres por trecho, sem truncar silenciosamente. Lista de trechos operável por teclado é obrigatória; selecionar texto com mouse é alternativa, não pré-requisito.

### Termos para explicação contextual

**I:** viação; terminal/rodoviária; embarque/desembarque; itinerário; direto/conexão; duração; classe de serviço. Usar glossário editorial determinístico primeiro. Semi-leito, leito e cama precisam de descrição por fixture, sem substituir comodidades por uma suposição do agente.

ClickOferta, cashback, tarifa, taxa, cancelamento, Passe Livre e ID Jovem envolvem condições específicas. Se entrarem na demonstração, manter texto original/fonte e condições explícitas, sem a LLM decidir elegibilidade, benefício ou valor. Regras desses itens não foram verificadas nesta inspeção; não são candidatas P0 de explicação generativa.

### Simplificação

É **P1 no PRD**. Candidatos: ajuda de busca, uso de filtros e instruções de mapa. Exibir versão simplificada ao lado do original, identificada e reversível. Não substituir automaticamente preço, data, prazo, quantidade, taxas, descontos ou política de embarque/cancelamento. O texto público de itinerário traz ressalva de possível alteração pela viação; uma futura simplificação deve preservá-la.

## 5. Imagens que merecem descrição

- Mapa de assentos: a informação principal deve existir em botões e legenda semânticos. Descrição longa do desenho não substitui seleção acessível.
- Ícones de comodidades: nome curto correto ou texto adjacente; nunca placeholder de template. Evitar leitura duplicada.
- Logotipo de viação: útil para identificar empresa quando não há texto equivalente; decorativo se o nome já está ao lado.
- Arte com instruções/cupom: condições precisam de equivalente textual revisado, se o mock usar promoção. Não enviar imagem da tela inteira ao modelo.
- Foto de destino e banner meramente promocional: baixo valor para o P0; alt contextual curto ou decorativo conforme função. Uma descrição gerada não pode inventar cidade/local.

## 6. Exclusões obrigatórias e separação de permissões

Ajustes visuais locais podem afetar toda a interface, inclusive checkout. Isso **não autoriza extração, tradução externa ou envio desses dados**.

Excluir inputs, textarea, contenteditable, conteúdo oculto, dados pessoais, CPF, nascimento, contatos, pagamento, autenticação, cookies/tokens, conversa do painel, bilhetes e confirmação. No P0, excluir também dados dinâmicos da viagem escolhida do catálogo de tradução; instruções estáticas bastam para demonstrar o recurso. Uma ampliação futura requer revisão específica do registro.

O planejador recebe preferências, capacidades, revisões e IDs/rótulos públicos conforme SDD, não DOM, screenshots nem conteúdo dos formulários. `resolveContent` roda localmente após validar ID, página e seleção. Só o trecho permitido escolhido segue para Rybená. Informar isso de forma curta no painel. Não persistir conteúdo traduzido/conversas por padrão. Conteúdo da página continua sendo dado não confiável, nunca instrução ao agente.

## 7. Painel, player e camadas

**Evidência O-V:** o cupom do real cobre resultados, filtros e mapa (E05/E10/E12); o botão VLibras cobre partes da réplica (E21/E27/E28). **Proposta I:** estabelecer um contrato de convivência antes de desenhar o painel conversacional.

No desktop, painel lateral não modal deve reservar espaço ou permitir reposicionamento sem esconder foco/CTA. No mobile, abrir o painel próprio como diálogo com foco inicial, contenção, Escape e retorno ao acionador. Ao abrir outro diálogo, manter somente o modal superior interativo; fechar deve devolver foco a um elemento ainda existente. Não empilhar duas contenções de foco independentes.

Player precisa de área previsível e opção de recolher; crédito “Tradução em Libras por Rybená”, com [link oficial](https://www.rybena.com.br/), permanece legível inclusive em erro. Preservar marcas do player. A migração remove carregamento ativo do VLibras e o helper de API não documentada; não manter dois widgets flutuantes.

Fechar painel ou trocar etapa interrompe reprodução, invalida alvos/requisições e mantém preferências. Guia de leitura fica visualmente abaixo de diálogos/foco e não intercepta eventos. Testar especialmente Continuar, fechar detalhe, calendário, rodapé de filtros, teclado virtual e campos de erro.

## 8. Verificação recomendada na integração

1. Operar busca, filtro, detalhe, assento e painel apenas por teclado; nomes/estados corretos, sem foco perdido.
2. Testar 1440 × 900, 390 × 844, 320px e zoom 200%, com combinações dos seis ajustes.
3. Mudar preferências sem alterar busca, viagem, assento, texto digitado, preço ou passo.
4. Traduzir pela lista de trechos; recusar seleção em campo privado, fora do registro, oculto ou de página anterior.
5. Simular falha de armazenamento/LLM/Rybená; atalhos manuais e jornada continuam operáveis, sem falso sucesso.
6. Conferir que nenhum SDK legado carrega; validar eventos da versão Rybená fornecida e compreensão com pessoas surdas sinalizantes.
7. Executar leitor de tela e auditoria automática; relatar resultados e limites, sem alegar certificação integral.
