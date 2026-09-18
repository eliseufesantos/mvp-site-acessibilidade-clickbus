# Acessibilidade

Estado atualizado em 9 de setembro de 2026. A especificação completa está em [`../accessibility-agent/`](../accessibility-agent/README.md).

## Painel

O acionador “Acessibilidade” mantém nome estável e abre três áreas:

- **Conversa:** envia texto a um planejador servidor e mostra estado ativo, proposta, confirmação e recibo;
- **Ajustes:** controles determinísticos que funcionam sem IA;
- **Conteúdo:** glossário/explicação, simplificação com original preservado e estado Rybená.

No desktop o painel é não modal. Em até 820 px vira diálogo, prende o foco, bloqueia a rolagem de fundo e fecha por Escape. A troca de etapa desmonta o painel e invalida requisições.

## Preferências v3

`useAccessibilityPreferences` persiste `clickbus-a11y-v3`, migra `clickbus-a11y-v1`/`v2`, mantém uma revisão monotônica e tolera armazenamento bloqueado.

Ferramentas disponíveis:

- contraste padrão/alto;
- texto em 100%, 112%, 125% ou 150%;
- controles e cursor maiores;
- destaque de links e títulos;
- espaço entre letras e entrelinha independentes;
- alinhamento original, à esquerda ou centralizado;
- guia e máscara de leitura combináveis;
- movimento reduzido;
- preset Leitura confortável, restauração e desfazer.

Os efeitos usam atributos `data-*` e CSS declarativo. Guia e máscara têm `pointer-events: none`. Nenhuma ferramenta altera busca, viagem, assento, passageiro ou pagamento.

## Planejador seguro

O frontend envia contexto mínimo para `/api/accessibility/plan`: mensagem, preferências, revisão, página/sessão, capacidades e IDs/rótulos públicos. O modelo não recebe DOM, screenshots, campos da jornada nem ferramentas de navegador.

A resposta segue contrato 2.0 fechado. O executor verifica schema, `requestId`, revisão, página, sessão, capacidades e conteúdo antes de executar. `planId` é idempotente. Pedidos vagos usam proposta com confirmação; operações comerciais e código estão fora do contrato.

Sem as variáveis de servidor `ACCESSIBILITY_LLM_ENDPOINT`, `ACCESSIBILITY_LLM_MODEL` e `ACCESSIBILITY_LLM_API_KEY`, os endpoints respondem 503 e a interface mantém todos os ajustes manuais. Para Gemini, a base é `https://generativelanguage.googleapis.com/v1beta`; a chave vai somente no header do request servidor. Não há interpretação local por regex apresentada como IA.

O endpoint exige origem autorizada e JSON, aceita no máximo 16 KiB, limita saída a 1.024 tokens, não faz retry e aplica quota local padrão de 12 chamadas/minuto por IP e 200/dia por instância. Essa quota stateless não substitui limites persistentes do host e budget/quota do projeto Google em publicação pública.

## Conteúdo

O glossário local explica termos revisados como “viação”, “terminal”, “embarque”, “itinerário” e “conexão”. Termos desconhecidos e simplificação usam endpoints separados, quando configurados. Resultados não entram no executor e nunca substituem o original.

Somente alvos registrados nas etapas de busca, resultados e assentos são aceitos. Checkout e confirmação retornam lista vazia. Seleção de página exige ancestral com `data-a11y-content-id`.

## Voz

O reconhecimento de voz depende do navegador, começa e termina apenas por ação explícita, mostra indicador ativo e mantém transcrição editável. “Usar transcrição” apenas copia o texto para o campo; não envia automaticamente. Fechar o painel aborta a captura. A UI avisa que o navegador pode processar áudio remotamente.

## Libras e Rybená

A autorização gratuita da Rybená está confirmada e o crédito/link são obrigatórios. A documentação pública fornece CDN, modo API, métodos e eventos básicos. Ainda faltam domínio/token autorizado e homologação.

Nesta entrega, `RybenaBrowserAdapter` carrega a API somente ao solicitar tradução, com `doNotTrack="true"`, e oferece abrir/fechar, pausar, retomar, parar e velocidade. O teste local recebeu “Token Rybená não autorizado”. Não existe polling, retry automático, VLibras ou tradução simulada.

## Navegação e semântica

- link “Pular para o conteúdo principal”;
- regiões semânticas, foco visível e progresso em lista;
- comboboxes e mapa de assentos operáveis por teclado;
- switches e grupos segmentados com estado anunciado;
- foco no conteúdo ao trocar de etapa;
- erros de formulário associados aos campos;
- feedback com `role="status"`/`role="alert"` quando aplicável.

O navegador integrado e inspeções automatizadas não substituem teste humano com NVDA/VoiceOver nem avaliação da tradução por pessoas surdas sinalizantes.
