# Design do painel de acessibilidade

Versão 1.0 · 9 de setembro de 2026.

## Conceitos aceitos para implementação

- [Conversa desktop](concepts/panel-conversation-desktop.png)
- [Ajustes desktop](concepts/panel-adjustments-desktop.png)
- [Conteúdo mobile](concepts/panel-content-mobile.png)

Os conceitos definem composição, densidade e hierarquia. O texto final segue PRD/SDD e conteúdo revisado do repositório; exemplos inventados pelo gerador de imagem não são fonte de regras de viagem, privacidade ou tradução.

## Sistema visual

- fundo da página: `#FAFAFA`; superfícies: branco puro;
- ação: `#A528FF`; ação forte: `#8629CC`; amarelo `#FFC800` somente como apoio;
- texto `#222222`; bordas cinza claras; sombra existente da réplica;
- Rubik local; rótulos de controles entre `0.82rem` e `0.95rem`;
- raios existentes de 8, 12 e 20 px;
- ícones Lucide de traço simples, 18–22 px;
- linhas/divisores e áreas abertas; cartões somente para mensagem, proposta/resultado e estado Rybená.

## Container e composição

- desktop: drawer lateral não modal, 560 px, da base do header ao viewport; página permanece operável;
- mobile até 820 px: diálogo fixo abaixo do header, largura total, rolagem interna e foco contido;
- cabeçalho do painel com título, subtítulo curto e fechar;
- resumo de preferências ativas e desfazer antes das abas;
- abas: `Conversa`, `Ajustes`, `Conteúdo`;
- rodapé de privacidade/ações fica no fluxo, nunca sobre controles.

## Texto visível permitido no topo do painel

`Acessibilidade`, `Ajuste o site à sua forma de ler e interagir.`, `Preferências ativas`, `Nenhum ajuste ativo`, `Desfazer`, `Conversa`, `Ajustes`, `Conteúdo`.

Não adicionar nome de produto novo, badge, métrica, selo, promessa de conformidade ou texto que sugira tradução operacional.

## Componentes e estados

- conversa: mensagem inicial, três exemplos, textarea, microfone explícito e enviar;
- proposta: resumo do patch, aplicar e cancelar;
- recibo: resultado local real, inclusive parcial ou `no_change`;
- ajustes: seções Apresentação, Leitura e Conforto; segmented controls e switches existentes;
- conteúdo: glossário/explicação, simplificação com original preservado e bloco Rybená indisponível;
- voz: indisponível, ociosa, ouvindo, transcrição pronta e erro;
- Rybená: somente `unavailable_pending_provider_configuration` nesta entrega.

## Media e continuidade

O painel não introduz mídia, gradiente, avatar ou ilustração. A campanha e a imagem da home permanecem inalteradas e sem novo overlay. Em desktop, o drawer cobre apenas a faixa direita; em mobile, a modal é a superfície principal.

## Responsividade e interação

- controles com no mínimo 44 px e 48/56 px no modo ampliado;
- sem rolagem horizontal a 320 px;
- botões podem quebrar linha sem truncar;
- tabs permanecem visíveis e roláveis se necessário;
- estados selecionado, hover, foco, disabled e loading usam o mesmo sistema;
- movimento respeita `prefers-reduced-motion` e preferência explícita.

## Registro de fidelidade pós-implementação

Comparação final feita entre `concepts/panel-content-mobile.png` e `evidence/implementation-panel-content-mobile-320.png`, com captura real por Chrome headless + CDP em 320×844 CSS px. Desktop e interações também foram inspecionados no navegador integrado em 1265×711 e 378×629.

Elementos preservados dos conceitos:

- drawer lateral no desktop e superfície de largura total no mobile;
- três abas persistentes, cabeçalho claro e ação de fechar;
- paleta branca, roxa e preta da réplica, com bordas discretas;
- resumo de preferências ativas antes das ferramentas;
- explicação e simplificação como operações separadas;
- bloco Rybená com estado e atribuição visíveis, sem confundir com o núcleo.

Desvios intencionais:

- conteúdo de privacidade, leito ou regras inventado pelo gerador não foi copiado; a UI usa somente alvos públicos estáticos autorizados da réplica;
- cartões de resultado de IA não são encenados: sem provedor, a interface mostra o 503 seguro e preserva os controles manuais;
- controles de player/velocidade não aparecem enquanto a API real Rybená estiver indisponível; o bloco mantém estado técnico estável e crédito;
- a versão mobile ocupa a área abaixo do header ClickBus real, sem moldura de telefone, alça de bottom sheet ou navegação inventada;
- em 320 px, textos e cartões têm densidade menor para reflow, sem remover funções ou truncar ações.

Diferença de copy: os conceitos usam textos ilustrativos gerados; a implementação usa “Ajustes locais, reversíveis...” e mensagens de limitação coerentes com PRD/SDD. Nenhuma promessa de IA, Libras, privacidade ou regra comercial foi inferida das imagens.
