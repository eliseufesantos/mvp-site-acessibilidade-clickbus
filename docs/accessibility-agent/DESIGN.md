# Design do painel de acessibilidade

Versão 1.2 · 17 de setembro de 2026.

## Sistema visual

- fundo da página: `#FAFAFA`; superfícies: branco puro;
- cabeçalho do plugin: ameixa `#430867`; ação: violeta `#9626FF`; ação forte: `#7417C7`;
- texto `#211529`; apoio `#675D70`; bordas lilás-cinza `#E5DDEB`;
- Rubik local; rótulos de controles entre `0.82rem` e `0.95rem`;
- raios existentes de 8, 12 e 20 px;
- ícones Lucide de traço simples, 18–22 px;
- linhas/divisores e áreas abertas; cartões somente para mensagem, seleção, proposta/resultado e estado Rybená;
- marca de rota em traço fino no cabeçalho, construída em SVG local e sem imagem remota.

## Container e composição

- acionador: botão fixo na borda esquerda, fora do header e presente em todas as etapas da jornada;
- desktop: drawer não modal de até 448 px, anexado ao acionador; página permanece operável e não recebe backdrop;
- mobile até 820 px: diálogo modal com backdrop, rolagem interna e foco contido; até 480 px ocupa todo o viewport;
- cabeçalho ameixa do painel com ícone, título, subtítulo curto, marca de rota e fechar;
- abas: `Conversa`, `Ajustes`, `Conteúdo`;
- rodapé de privacidade/ações fica no fluxo, nunca sobre controles.

## Texto visível permitido no topo do painel

`Acessibilidade`, `Ajustes que acompanham você.`, `Agora na página`, `Nenhum ajuste visual adicional está ativo.`, `Desfazer`, `Conversa`, `Ajustes`, `Conteúdo`.

Não adicionar nome de produto novo, badge, métrica, selo, promessa de conformidade ou texto que sugira tradução operacional.

## Componentes e estados

- conversa: mensagem inicial, três exemplos, textarea, microfone explícito e enviar;
- proposta: resumo do patch, aplicar e cancelar;
- recibo: resultado local real, inclusive parcial ou `no_change`;
- ajustes: seções Apresentação, Leitura e Conforto; segmented controls e switches existentes;
- conteúdo: glossário/explicação, modo explícito de seleção, simplificação local revisada com original preservado e controles Rybená sob demanda;
- seleção: ao acionar “Selecionar na página”, o painel recolhe, a página fica selecionável e uma instrução curta permanece visível; ao concluir ou cancelar, o painel retorna com foco no campo do termo;
- voz: indisponível, ociosa, ouvindo, transcrição pronta e erro;
- Rybená: `idle`, carregando, pronta, traduzindo, pausada ou falha; domínio/token recusado deve permanecer explícito.

## Media e continuidade

O painel não introduz mídia raster, gradiente, avatar ou ilustração. A campanha e a imagem da home permanecem inalteradas e sem novo overlay no desktop. O traço de rota no cabeçalho é um ornamento vetorial local. Em mobile, o backdrop pertence apenas ao estado modal; no modo de seleção ele é removido para liberar a página.

## Responsividade e interação

- controles com no mínimo 44 px e 48/56 px no modo ampliado;
- sem rolagem horizontal a 320 px;
- botões podem quebrar linha sem truncar;
- tabs permanecem visíveis e roláveis se necessário;
- estados selecionado, hover, foco, disabled e loading usam o mesmo sistema;
- movimento respeita `prefers-reduced-motion` e preferência explícita.

## Direção lateral atual

A iteração de 14/09/2026 preserva o minimalismo, mas troca a aparência de menu genérico por uma identidade própria ligada à jornada: acionador vertical violeta, cabeçalho ameixa, marca de rota e drawer anexado à borda esquerda. O botão foi removido do header; ofertas, ajuda e navegação principal permanecem inalterados.

Na aba Conteúdo, a hierarquia visível é: orientação curta, seleção na página, campo do termo e explicação; em seguida, trecho original, ação “Simplificar trecho” e versão simplificada separada. As versões simples dos alvos iniciais são locais e revisadas, por isso a interface não as apresenta como IA. A seção Rybená oferece trecho, velocidade, tradução e reprodução; o script só carrega após clique e falhas nunca são apresentadas como tradução.
