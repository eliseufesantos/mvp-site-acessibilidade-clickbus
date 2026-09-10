# Arquitetura

## Stack

- React 18 para a interface;
- TypeScript em modo estrito;
- Vite para desenvolvimento e build;
- CSS global organizado por tokens e componentes;
- Lucide React para ícones;
- Fontsource para Rubik e Roboto Mono locais.

## Estrutura da aplicação

```text
app/src/
├── app/App.tsx                         # estado e navegação da jornada
├── components/
│   ├── accessibility/                  # fachadas do painel, status e ajudas de leitura
│   ├── brand/                          # logo oficial vetorizado
│   ├── layout/                         # cabeçalho global
│   └── ui/                             # botão, switch e progresso
├── data/trips.ts                       # viagens fictícias
├── features/
│   ├── search/                         # home, busca e combobox
│   ├── results/                        # filtros e cards de viagem
│   ├── seats/                          # mapa e seleção de assento
│   ├── checkout/                       # dados e validação
│   ├── confirmation/                   # confirmação da compra
│   └── accessibility-agent/
│       ├── core/                       # contratos, store, planner client e executor
│       ├── adapters/                   # conteúdo ClickBus e porta Libras/Rybená
│       ├── ui/                         # conversa, ajustes, conteúdo e voz
│       └── tests/                      # suíte executável do núcleo
├── hooks/useAccessibilityPreferences.ts
├── styles/
│   ├── tokens.css                      # cores, espaços e modos
│   ├── global.css                      # reset e base semântica
│   └── components.css                  # layouts e componentes
├── types.ts
└── main.tsx
```

## Estado e navegação

`App.tsx` implementa uma máquina de estados pequena com cinco etapas:

```text
search → results → seats → checkout → confirmation
```

Não foi adicionado React Router porque o MVP tem uma única jornada linear e isso reduz dependências. Busca, viagem e assento ficam em estado React. Ao mudar de etapa, a página retorna ao topo e o foco vai para o conteúdo principal sem provocar rolagem indevida.

## Limites entre componentes

- Componentes de `ui/` não conhecem a regra da jornada.
- Cada pasta de `features/` recebe dados e callbacks por propriedades.
- `data/trips.ts` concentra conteúdo fictício e formatação monetária.
- O hook de acessibilidade é o único responsável por persistir preferências e alterar atributos no elemento `html`.
- A LLM nunca recebe funções de DOM/navegação: responde um plano JSON fechado, validado novamente pelo executor local.
- Conteúdo autorizado é um registro estático por etapa; checkout e confirmação não são alvos.
- O adaptador Rybená atual é indisponível por projeto e não faz rede.

Para incluir uma nova etapa, atualize `JourneyStep` em `types.ts`, o mapa de títulos e a composição em `App.tsx`.
