# Produto

O que o protótipo faz, o que fica de fora e por quê. O estado de cada verificação está em [VALIDACAO.md](VALIDACAO.md).

## O que é

MVP acadêmico (FIAP) que replica a jornada de compra da ClickBus com dados fictícios:

```text
busca → resultados → seleção de assento → passageiro → confirmação simulada
```

Sobre essa réplica roda um **plugin de acessibilidade**: ajustes visuais e de leitura, um assistente por linguagem natural e Libras/voz pela Rybená. Não há consulta comercial real, emissão de bilhete, reserva, cancelamento nem pagamento.

A réplica é a aplicação hospedeira, e sua identidade visual é preservada. O plugin é uma camada independente da jornada.

## Princípios

- **A IA só planeja.** Ela devolve um plano tipado; um executor local valida e aplica ferramentas já implementadas. Ela não recebe DOM nem ferramentas de navegação ou de compra, e não gera CSS ou JavaScript.
- **Local antes da rede.** Ajustes, glossário e simplificações revisadas funcionam sem IA e sem Rybená.
- **O conteúdo original nunca é substituído.** Explicações e simplificações aparecem à parte.
- **Nada é inferido sobre a pessoa.** Nem idade, nem deficiência, nem diagnóstico.
- **Nenhuma alegação sem evidência.** Nada de conformidade integral com WCAG, de IA confiável ou de tradução em Libras homologada.

## O painel

O acionador fica no fim do header, com o pictograma universal de acessibilidade. Como o header é `position: sticky`, ele continua alcançável durante a rolagem. Um contador mostra quantos ajustes estão ativos.

- **Desktop (≥ 821 px):** região não modal, ancorada abaixo do header, à direita; a página continua operável.
- **Celular (≤ 820 px):** diálogo modal em tela cheia, com foco contido, Escape e retorno ao acionador.

A raiz do painel tem duas vistas, alternadas por uma chave:

| Vista | Conteúdo |
| --- | --- |
| **Assistente** (inicial) | o chat |
| **Recursos** | grade 2×2: Libras, Voz, Ajustes visuais e Sobre |

Abrir o painel sempre começa na raiz. Nas superfícies de Ajustes e Sobre o chat continua visível na base. O painel **não fecha** ao trocar de etapa da jornada; as propostas pendentes, que seriam recusadas, são recolhidas.

## Ajustes visuais

| Grupo | Ajustes |
| --- | --- |
| Apresentação | contraste padrão ou alto; texto em 100%, 112,5%, 125% ou 150%; controles grandes; cursor grande; destaque de links; destaque de títulos |
| Leitura | espaçamento entre letras; entrelinha padrão, confortável ou ampla; alinhamento original, à esquerda ou centralizado; guia de leitura; máscara de leitura |
| Conforto | movimento reduzido; fonte para dislexia |
| Cores | saturação padrão, alta, baixa ou escala de cinza; correção de cores para protanopia, deuteranopia ou tritanopia |

- O preset **Leitura confortável** aplica um patch explícito (texto 112,5%, letras ampliadas, entrelinha confortável, alinhamento à esquerda e movimento reduzido) e preserva o resto.
- **Restaurar** volta ao padrão. **Desfazer** reverte a última transação.
- Guia e máscara não interceptam cliques nem escondem o foco.
- A correção de cores é uma aproximação. Não é simulação clínica e não substitui contraste adequado nem outro sinal além da cor.
- Só as preferências são persistidas. Conversa, áudio e conteúdo não são guardados.

## Assistente

Um único campo atende ajuste e dicionário: "aumente o texto" e "o que é viação?" entram pelo mesmo lugar. Quem decide o destino é o **plano**, nunca uma heurística de texto no cliente.

- **Pedido explícito e reversível:** é aplicado direto.
- **Pedido vago:** gera uma proposta, que só altera a página depois de confirmada.
- **Explicar um termo:** o glossário revisado responde primeiro, sem rede. Quando a explicação vem da IA, a interface pede que a pessoa confira.
- **Simplificar um trecho:** só trechos públicos registrados; os iniciais têm versão local revisada.
- **Ditado:** começa e termina por ação explícita; a transcrição fica editável e não é enviada sozinha.
- **Sugestões:** os chips só preenchem o campo, nunca enviam.
- **Falha da IA:** em indisponibilidade, cota ou sobrecarga, o chat oferece um atalho para a vista Recursos, que funciona sem rede.

O termo chega pelo campo, digitado, ditado ou colado. Não existe modo de seleção de texto na página.

## Libras e voz

Libras e voz são **dois modos do mesmo player da Rybená**. Os cartões abrem a aplicação dela, e a seleção do texto acontece na interface do fornecedor.

- O script só é carregado depois de um clique.
- O crédito "Tradução em Libras por Rybená" é obrigatório.
- Não há VLibras, polling nem tradução simulada em produção.
- Em desenvolvimento existe uma simulação, sempre com aviso visível, que não entra no bundle de produção.

## Privacidade e exclusões

Checkout, passageiro, bilhete, preço, pagamento e confirmação **nunca** são enviados ao planejador nem às ferramentas de conteúdo.

Essa exclusão não alcança a seleção livre dentro da barra da Rybená: ali, qualquer texto da página pode chegar ao fornecedor, inclusive nome e CPF no checkout. O responsável aceitou essa consequência em 19/09/2026.

## Fora do escopo

Operações comerciais reais, navegação facial, reconhecimento de Libras por câmera, lupa sob o cursor, descrição automática de imagens, reorganização livre da página por IA, cores arbitrárias, RAG, banco de conversas, treinamento de modelo e multiagentes.

## Decisões

| Data | Decisão | Motivo |
| --- | --- | --- |
| 19/09/2026 | Ajustes visuais são exclusivos do executor local; a Rybená atende só Libras e voz | a Rybená oferece os mesmos ajustes, e os efeitos somariam (zoom dobrado, contrastes em conflito); a versão local funciona sem rede e sem token |
| 19/09/2026 | Libras e voz são um único port com troca de modo | é o modelo do fornecedor; dois ports criariam dois players disputando o mesmo runtime |
| 19/09/2026 | Acionador sai da lateral e vai para o header | padrão da referência; vale enquanto o header for sticky |
| 19/09/2026 | Correção de cores por daltonização, `D = I + E·(I − S)` | a primeira versão usava matrizes de simulação e piorava a separação entre as cores confundidas |
| 19/09/2026 | Seleção de texto entregue à barra da Rybená | aceito o risco de envio de dados do checkout ao fornecedor |
| 19/09/2026 | Um chat só para ajuste e dicionário (contrato 2.2) | o planejador já recebia os alvos públicos; faltava o contrato falar de conteúdo |
| 19/09/2026 | O painel sobrevive à troca de etapa | a proteção contra plano velho é o `pageEpoch` no executor, não fechar o painel |
| 20/09/2026 | Modo de seleção de texto na página removido | cobria só quatro trechos de ajuda e exigia modo modal, gestão de foco e recusas próprias |
| 20/09/2026 | Raiz com duas vistas, assistente por padrão | a grade sempre visível ocupava cerca de 280 px e empurrava o campo para fora do alcance |
| 20/09/2026 | A procedência das respostas determinísticas não é anunciada | quem pergunta quer a informação, não o funcionamento interno; isso fica para a apresentação |
