# Acessibilidade

## Preferências globais

O menu “Acessibilidade” oferece:

- alto contraste;
- modo idoso;
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

