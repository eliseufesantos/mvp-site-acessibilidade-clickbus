# Design system

## Fontes de verdade

Os anexos recebidos foram preservados em:

- `docs/brand/brand-book-a4.pdf`
- `docs/brand/brand-book-a4.html`
- `docs/brand/design-system.html`


## Tokens principais

| Papel | Valor padrão |
|---|---|
| Roxo principal | `#A528FF` |
| Roxo escuro | `#8629CC` |
| Amarelo | `#FFC800` |
| Texto | `#222222` |
| Fundo | `#FAFAFA` |
| Superfície | `#FFFFFF` |
| Borda | `#D6D6D6` |
| Raio base | `8px` |

Os valores são expostos como propriedades CSS em `app/src/styles/tokens.css`. Não espalhe cores hexadecimais novas pelos componentes; prefira um token semântico.

## Tipografia

- Rubik: interface, títulos e textos;
- Roboto Mono: etiquetas curtas e indicadores de etapa.

As fontes são empacotadas localmente pelo Fontsource para evitar dependência do Google Fonts durante a demonstração.

## Regras visuais

- botões principais usam preenchimento forte e texto em negrito;
- ícones têm traço simples e vêm da biblioteca Lucide;
- cards usam uma borda clara e pouco efeito de profundidade;
- foco de teclado usa contorno de 3 px e não depende apenas de cor;
- o logo em `ClickBusLogo.tsx` reutiliza os caminhos vetoriais do material fornecido.

## Variações

O alto contraste troca tokens sem duplicar componentes. O modo idoso aumenta a fonte raiz, a altura dos controles e os espaçamentos, além de ocultar navegação e conteúdo promocional secundário.

