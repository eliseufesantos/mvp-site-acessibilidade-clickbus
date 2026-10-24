# Design system

## Fontes de verdade

Os anexos recebidos estão em `brand/`:

- `brand-book-a4.pdf`: manual de marca, com `brand-book-a4.html` como fonte;
- `design-system.html`: tokens e componentes visuais extraídos da ClickBus.

No código, os tokens ficam em `app/src/styles/tokens.css`. Não espalhe cores hexadecimais pelos componentes: use um token semântico.

## Tokens da réplica

| Papel | Token | Valor |
| --- | --- | --- |
| Roxo principal | `--cb-primary` | `#A528FF` |
| Roxo escuro | `--cb-primary-strong` | `#8629CC` |
| Amarelo | `--cb-yellow` | `#FFC800` |
| Texto | `--cb-text` | `#222222` |
| Texto de apoio | `--cb-muted` | `#5F5F5F` |
| Fundo | `--cb-background` | `#FAFAFA` |
| Superfície | `--cb-surface` | `#FFFFFF` |
| Borda | `--cb-border` | `#D6D6D6` |
| Foco | `--cb-focus` | `#5C00A5` |

Raios: 8, 12 e 20 px (`--radius-sm`, `--radius-md`, `--radius-lg`). Altura de controle: 48 px, ou 56 px com "controles grandes".

## Tokens do painel de acessibilidade

O painel tem paleta própria, mais escura, para se distinguir da página sem destoar da marca:

| Papel | Token | Valor |
| --- | --- | --- |
| Cabeçalho | `--a11y-plum` | `#430867` |
| Ação | `--a11y-accent` | `#9626FF` |
| Ação forte | `--a11y-accent-strong` | `#7417C7` |
| Texto | `--a11y-text` | `#211529` |
| Apoio | `--a11y-muted` | `#675D70` |
| Borda | `--a11y-border` | `#E5DDEB` |

## Tipografia

- **Rubik:** interface, títulos e textos.
- **Roboto Mono:** etiquetas curtas e indicadores de etapa.

As duas são empacotadas localmente pelo Fontsource, para a demonstração não depender do Google Fonts.

## Regras visuais

- Botões principais usam preenchimento forte e texto em negrito.
- Ícones são da Lucide, de traço simples. Use os existentes antes de criar uma primitiva nova.
- Cards usam borda clara e pouca profundidade.
- O foco de teclado usa contorno de 3 px e não depende só de cor.
- O logo em `components/brand/ClickBusLogo.tsx` reaproveita os caminhos vetoriais do material fornecido.
- O alto contraste troca tokens, sem duplicar componentes.

## Painel

- O acionador usa o pictograma universal de acesso (`features/accessibility-agent/ui/UniversalAccessIcon.tsx`). Não troque pelo ícone de cadeira de rodas: ele representa mobilidade e comunica menos do que o painel oferece.
- Cartão que navega é `<button>`. A chave Assistente/Recursos são dois `<button>` com `aria-pressed`, nunca `role="tab"`.
- Sem rolagem horizontal a 320 px, inclusive com texto a 150% e alto contraste.
- Botões podem quebrar linha, mas não truncar.
- O movimento respeita `prefers-reduced-motion` e a preferência explícita.
- Sem avatar, ilustração, badge de conformidade ou texto que sugira tradução operacional não verificada.
