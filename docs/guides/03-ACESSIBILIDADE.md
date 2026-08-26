# Acessibilidade

## Preferências globais

O menu “Acessibilidade” oferece:

- alto contraste;
- modo idoso;
- tradução em Libras (VLibras);
- redução de animações;
- restauração do padrão.

As preferências são persistidas no navegador em `clickbus-a11y-v1`. Apenas booleanos de interface são salvos; não há inferência nem armazenamento de idade ou diagnóstico.

## Alto contraste

Quando ativo, o elemento `html` recebe `data-contrast="true"`. Os tokens mudam para fundo preto, texto branco, ação amarela e bordas brancas. Elementos decorativos de baixo valor são removidos, e o logo recebe uma variação legível.

## Modo idoso

Quando ativo, `data-elderly="true"`:

- aumenta a fonte raiz para 18 px;
- aumenta controles para pelo menos 56 px;
- amplia espaços e assentos;
- remove links secundários do cabeçalho;
- oculta o terceiro card promocional da home.

É um modo de apresentação voluntário, não um diagnóstico de usuário.

## Tradução em Libras (VLibras)

O widget do [VLibras](https://vlibras.gov.br/) traduz o texto da página para Libras com um avatar 3D. É a suíte oficial do governo brasileiro (gov.br), gratuita e de código aberto sob LGPL-3.0. Foi escolhida no lugar do Rybená, que é licenciado por plano comercial.

Como funciona na aplicação:

- `components/accessibility/VLibrasWidget.tsx` injeta `https://vlibras.gov.br/app/vlibras-plugin.js` uma única vez, na primeira ativação;
- esse script tem cerca de 2 KB e apenas desenha o botão flutuante; o player 3D só é baixado quando a pessoa abre a tradução;
- o widget vive fora do React, em shadow DOM no fim do `body`, então a preferência controla apenas a exibição, por `html[data-libras]` em `components.css`;
- desligar a preferência também fecha o player aberto.

A tradução vem ligada por padrão: quem depende dela não deveria precisar abrir um menu para encontrá-la, e o custo inicial é apenas o do carregador de 2 KB.

### Leitura das opções do combobox

O VLibras traduz o texto que a pessoa seleciona com o mouse, e isso não alcança interface efêmera: clicar numa opção da lista de cidades a fecha antes de existir qualquer seleção.

`components/accessibility/signLibras.ts` contorna isso enviando o texto direto ao avatar por `window.vlibras.translateAndPlay`. O combobox chama essa função quando a opção em foco muda, com 250 ms de espera para não disparar uma tradução a cada tecla. Parênteses viram vírgula antes do envio, porque o tradutor lida melhor com `São Paulo, SP` do que com `São Paulo (SP)`.

Essa API não está documentada pelo projeto VLibras e só existe depois que o player 3D termina de carregar. Por isso toda a chamada é opcional e protegida: se ela sumir numa versão futura, a navegação continua idêntica e apenas a leitura automática deixa de acontecer.

Limite: o widget é servido pelo gov.br e depende de conexão com a internet. Sem rede o botão não aparece, e o restante da jornada continua funcionando.

## Navegação e semântica

- link “Pular para o conteúdo principal”;
- cabeçalho, navegação, conteúdo principal e rodapé semânticos;
- comboboxes com setas, Enter e Escape;
- mapa de assentos operável por Tab e setas;
- switches com `role="switch"` e estado anunciado;
- progresso da jornada em lista ordenada;
- foco enviado ao conteúdo principal ao trocar de etapa;
- erros agrupados em resumo focável com `role="alert"`;
- campos inválidos usam `aria-invalid` e `aria-describedby`.

## Redução de movimento

O CSS respeita `prefers-reduced-motion` do sistema e também permite ativação manual. Transições e animações passam a ter duração praticamente nula.

## Limite da validação

O MVP recebeu testes de teclado e inspeção semântica no navegador integrado. Ainda é recomendável testar com NVDA ou VoiceOver e executar axe/Lighthouse antes de transformar o protótipo em produto.

