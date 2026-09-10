# Plano incremental de reconstrução e integração

**Status: recomendado, não executado.** 08/09/2026. A implementação depende de autorização posterior, conforme o briefing. Manter React/TypeScript/Vite, dados fictícios locais e componentes existentes. Ler [gaps](GAP-ANALYSIS.md), [conteúdo](ACESSIBILIDADE-E-CONTEUDO.md) e [SDD](../accessibility-agent/SDD.md) antes de editar.

## Recorte e dependências

```text
A1 Dados e navegação ──→ A2 Busca/home ──→ A3 Resultados/detalhes ──→ A4 Assentos
          └──────────────────→ A5 Semântica e contrato do hospedeiro ──┐
B1 Core/store/planejador em host mínimo ────────────────────────────────┤
B2 Adaptador Rybená + painel isolado ───────────────────────────────────┤
                                                                     ↓
                                                       B3 Integração e regressão
                                                                     ↓
                                                       C Acabamento posterior
```

Essa separação permite desenvolver o produto sem esperar rodapé, campanhas ou uma clonagem completa. B1/B2 podem avançar de forma independente por implementação sequencial ou trabalho coordenado autorizado; este documento não solicita automaticamente agentes ou sessões adicionais.

## A. Estabilizar a réplica antes de integrar

### A1 — Dados coerentes e invariantes da jornada

**Resolve:** G01, G02, G06, G11. **Arquivos existentes:** `app/src/types.ts`, `data/trips.ts`, `app/App.tsx`, `features/search/SearchPage.tsx`, `LocationCombobox.tsx`, `features/results/ResultsPage.tsx`, `features/seats/SeatSelectionPage.tsx`, `features/checkout/CheckoutPage.tsx`.

Introduzir catálogo pequeno com IDs de cidade e terminal; separar texto da busca de seleção válida. Preservar catálogo atual se útil, mas só oferecer rotas suportadas por fixtures. Calcular data inicial futura e mínimo com data local; formatar a mesma data em todas as etapas. Não fixar setembro de 2026 como novo padrão permanente.

Definir fixtures com ID, cidades/terminais, partida, chegada com indicação de dia seguinte, duração, classe enumerada, comodidades, preço fictício, texto de itinerário e mapa de assentos. A contagem de livres deriva do mapa da viagem. Não copiar inventário real.

Um conjunto de 6–8 viagens fictícias para a rota principal é suficiente para mostrar ordem por preço/horário, filtros de classe/período e uma combinação sem resultados. Manter texto público de ajuda separado das escolhas e do formulário. Reutilizar `formatCurrency`; acrescentar formatação de data/duração onde necessário.

**Aceite:**

- Mudar a data aparece no resumo, resultado, detalhe e checkout; nenhuma referência fixa a 30 de agosto permanece na jornada.
- Mudar origem/destino altera resultados coerentemente ou informa ausência; `zzzz` não gera cartão de outra rota.
- Semi-leito não satisfaz filtro de Leito por coincidência de substring.
- Quantidade livre do cartão corresponde ao mapa; escolher nova viagem limpa seleção incompatível.
- Voltar mantém dados pretendidos. Reiniciar limpa viagem/assento sem apagar preferências.
- Virada de mês/ano e chegada no dia seguinte têm apresentação coerente, sem backend real.

### A2 — Home e formulário reconhecíveis

**Resolve:** G04, parte de G18/G19. **Depende de:** A1. **Arquivos:** `features/search/SearchPage.tsx`, `LocationCombobox.tsx`, `components/layout/Header.tsx`, `styles/tokens.css`, `styles/global.css`, `styles/components.css`.

Reduzir o título e situá-lo no cartão da busca; compor campanha/área visual superior e seção pequena de ofertas, seguindo E01/E13. Usar materiais existentes da marca e conteúdo fictício coerente. Retirar explicações de implementação da jornada; a apresentação acadêmica e os documentos explicam o MVP. Manter acesso visível ao produto de acessibilidade.

Extrair um `SearchForm` reutilizável se a busca no cabeçalho dos resultados exigir; não reescrever o combobox inteiro se suas correções forem localizadas. Manter calendário nativo inicialmente: a construção de calendário customizado não é bloqueio para o agente. As ofertas do recorte devem preencher busca/navegar localmente, sem links comerciais reais disparados pelo mock.

**Aceite:**

- Em 1440 × 900 e 390 × 844, o formulário é reconhecível e utilizável; datas, troca e CTA não sobrepõem texto.
- Somente ida funciona de ponta a ponta; não exibir volta interativa sem implementar seu comportamento.
- Digitar, escolher, trocar e corrigir cidades funcionam por teclado; lista vazia não tem `aria-activedescendant` inválido.
- Campos/erros preservam nomes acessíveis e associações. Enter em seleção de data não envia acidentalmente a busca.
- Nenhum controle secundário parece funcional e leva a hash inexistente no recorte.

### A3 — Resultados e detalhe público

**Resolve:** G05, G07–G10. **Depende de:** A1/A2. **Arquivos:** `features/results/ResultsPage.tsx`, `components/layout/Header.tsx`, `data/trips.ts`, `styles/components.css`; novos componentes propostos `TripCard`, `ResultsFilters`, `TripDetailsDialog` e um diálogo genérico só se reutilizado.

Compactar título/resumo e reorganizar a lista conforme E06/E11. Implementar preço/horário e classe/período antes de filtros de todas as companhias/terminais. Exibir filtros ativos e limpar. Contagem deve refletir a lista atual, sem reproduzir o contador aparentemente constante observado no real. Priorizar um cartão completo visível cedo no mobile.

Adicionar itinerário com dados mockados de embarque/desembarque e duração. Abrir detalhe não escolhe viagem nem altera preferência. Calendário de dias adjacentes pode entrar como controle simples se A1 suportar datas; não exige buscar disponibilidade real. Mobile pode reutilizar filtros em diálogo acessível, com semântica explícita para aplicar/cancelar/limpar.

**Aceite:**

- Ordem e filtros mudam resultados observáveis e podem ser desfeitos; empate tem ordem estável.
- Existe cenário vazio alcançável com orientação e ação para limpar filtros.
- Cartão comunica viação, terminais, horários, classe, comodidades, preço e seleção com nome inequívoco.
- Detalhe abre/fecha por teclado, contém foco quando modal e devolve ao cartão correto.
- Mudar filtro/detalhe não altera assento/passagem silenciosamente. Nenhuma ação do plugin recebe callback comercial.
- Fixtures são síncronas por padrão; não introduzir spinners artificiais para fingir integração. Se houver camada assíncrona local, documentar carregamento, erro e recuperação reais.

### A4 — Assentos e regressão do formulário

**Resolve:** G11–G13 e preserva G23. **Depende de:** A1/A3. **Arquivos:** `features/seats/SeatSelectionPage.tsx`, `CheckoutPage.tsx`, `ConfirmationPage.tsx`, `components/ui/StepProgress.tsx`, `styles/components.css`, `app/App.tsx`.

Usar mapa por fixture; melhorar proporção/legenda e pôr mapa antes de resumo extenso no mobile. A página própria pode continuar: a abertura modal real não é razão suficiente para refazer a navegação. Caso haja modal, reutilizar a gestão de foco de A3. Corrigir setas por linha/coluna, sem compactar geometricamente os ocupados.

Preservar a etapa de passageiro local e seus erros, sem inventar checkout real a partir do progresso. Adicionar `aria-current=step` ao progresso. As mensagens de confirmação devem ser coerentes com o que o protótipo implementa, sem prometer um destino Meus pedidos inexistente.

**Aceite:**

- Lugares livres/ocupados/selecionados são compreensíveis sem depender da cor; bloqueados não são acionáveis.
- Setas respeitam geometria e Tab tem sequência previsível; nome/estado correto em português.
- Continuar indisponível sem escolha; valor/assento/viagem persistem ao voltar da etapa seguinte.
- Alterar tamanho/contraste não muda a seleção nem esconde CTA; mapa acessível a 390px e 320px.
- Formulário vazio mantém resumo focável e erros associados. Validações locais não são apresentadas como validação de documento real.
- Nenhuma integração com compra real é adicionada.

### A5 — Contrato semântico e camadas

**Resolve:** G03, G16 e prepara G14–G17. **Pode começar após A1; concluir depois das regiões de A2–A4.** **Arquivos:** `components/layout/Header.tsx`, `components/accessibility/AccessibilityPanel.tsx`, `app/App.tsx`, páginas e estilos.

Dar nome persistente ao acionador mesmo quando o rótulo é visualmente oculto. Padronizar retorno de foco. Definir painel mobile modal e desktop não modal; reservar espaço/limites que funcionem com texto maior. Marcar regiões e blocos públicos segundo [o registro proposto](ACESSIBILIDADE-E-CONTEUDO.md#3-registro-semântico-do-hospedeiro).

**Aceite:**

- Botão mantém nome “Acessibilidade” com zero ou vários modos ativos, em todas as larguras.
- Escape, botão fechar e fechamento por navegação têm destino de foco definido.
- IDs de conteúdo são únicos, estáveis e associados apenas a blocos públicos; mudanças de etapa invalidam alvos antigos.
- Painel, detalhe, calendário e futuros controles do player têm política de prioridade sem foco preso em duas camadas.
- Nada no registro extrai inputs, conversa, bilhete, pagamento ou conteúdo oculto.

## B. Desenvolver independentemente da fidelidade visual

### B1 — Store, ferramentas próprias e planejador

Seguir [IMPLEMENTATION.md](../accessibility-agent/IMPLEMENTATION.md) e os contratos do SDD. **Novos módulos propostos:** `shared/accessibility/`, `app/src/features/accessibility-agent/core/`, `client/`, `server/accessibility/` e `api/accessibility/plan.ts`.

Implementar seis ajustes, migração v1→v2, desfazer, recibos, validação de ações, revisões e rejeição de respostas obsoletas. Desenvolver em host mínimo separado da jornada, também previsto no PRD. Backend chama LLM real; chave só no servidor; controles manuais continuam disponíveis sem IA. Não migrar para Next.js por conveniência do endpoint.

**Aceite independente:** testes de contrato e executor, armazenamento inválido/bloqueado, mudança relativa, desfazer e proposta; pedidos comerciais não têm ferramentas de execução. A segunda página usa o mesmo núcleo sem importar `App.tsx` ou dados de viagem. Testes e falhas seguem [VALIDATION.md](../accessibility-agent/VALIDATION.md).

### B2 — Painel e adaptador Rybená

**Propostos:** `features/accessibility-agent/ui/`, `adapters/rybena/`. Configuração de SDK/domínio vem da parceria; verificar as assinaturas na versão fornecida. Isso é dependência operacional, não nova aprovação comercial.

Desenvolver estados de carregamento/reprodução/falha, tradução por referência pública, lista acessível de trechos, parar/pausar/velocidade e crédito. O painel pode ser validado no host mínimo, enquanto a réplica muda aparência.

**Aceite independente:** SDK real confirmado, comandos correspondentes a eventos/estado observável, falha não bloqueia ferramentas, crédito preservado. Não simular avatar/tradução. Fechar invalida operações tardias e interrompe mídia.

### B3 — Integração ao hospedeiro

**Depende de:** A5 + B1 + B2. **Toca:** `App.tsx`, hook/painel/banner legados, `VLibrasWidget.tsx`, `signLibras.ts`, `LocationCombobox.tsx`, estilos e adaptador ClickBus proposto.

Trocar montagem ativa do VLibras pelo adaptador Rybená; remover disparo automático na opção focada e migrar preferências sem fontes de verdade duplicadas. O agente configura apresentação e reprodução; não recebe navegação, busca, escolha, reserva ou preenchimento.

**Aceite:**

- Preferências migradas preservam valores mapeáveis e não iniciam reprodução automaticamente.
- Nenhum script/widget VLibras é carregado na execução normal após a migração.
- Pedidos diretos, propostas vagas, refinamento, desfazer, falhas e respostas tardias passam pelos casos do PRD/SDD.
- Traduzir `search-help`/`seat-map-help` funciona por teclado; campos privados nunca entram no envio.
- A jornada continua operável com LLM ou Rybená indisponível.
- Roteamento de `/api/*` e hospedagem seguem o SDD; não publicar endpoint pago irrestrito. Demo local/protegida é suficiente.

## C. Acabamento posterior

Depois da integração funcional: calibrar Noto Sans/tamanhos/raios, melhorar banners e ofertas, ajustar rodapé, adicionar detalhes secundários de viação, calendário desktop próprio e mais filtros. Ida/volta completa, checkout visual fiel, conta/clube/pedidos, campanhas com cupom, voz e simplificação generativa ficam fora da base necessária à demonstração atual.

Não reconstruir etapas comerciais reais não observadas. Para aproximá-las futuramente, obter uma fonte segura/autorizada ou registrar que o desenho é uma proposta do mock. Não usar screenshots antigos do repositório como se fossem observação atual.

## Critério de encerramento de cada incremento

Uma entrega deve ter escopo pequeno e revisar apenas os arquivos necessários. Executar typecheck/build quando houver mudança de código; testar as regras de dados e interações afetadas. Comparar capturas atuais em D/M com os pares deste mapeamento, distinguindo valores fictícios e estados diferentes.

Para A5/B3, ampliar para 320px, zoom 200%, teclado integral, leitor de tela e auditoria automática nos fluxos tocados. Confirmar que mudanças de apresentação não alteram estado comercial. Registrar evidências e limitações reais; não alegar conformidade ou qualidade linguística apenas por screenshot.

## Roteiro sugerido de demonstração

1. Abrir home e pedir texto maior/redução de movimento; confirmar alteração visível.
2. Pesquisar a rota fictícia suportada com data futura; comparar e filtrar viagens.
3. Abrir itinerário; escolher uma ajuda pública pela lista e reproduzir em Libras.
4. Abrir mapa local, navegar por teclado e selecionar um lugar fictício.
5. Refinar tamanho mantendo contraste; desfazer sem perder busca ou assento.
6. Opcionalmente mostrar formulário vazio e erros locais; não usar dados pessoais reais.
7. Mostrar brevemente o host mínimo para evidenciar separação do produto e da jornada.

## Handoff para a próxima sessão

“Leia `docs/clickbus-mapping/README.md`, a matriz e este plano, além do PRD/SDD do agente. Implemente somente a etapa explicitamente autorizada. Preserve alterações prévias. Use dados fictícios coerentes, mantenha semântica superior às barreiras do site real e não introduza operações comerciais reais. A autorização Rybená está resolvida; as novas funcionalidades ainda não estão implementadas por este mapeamento.”
