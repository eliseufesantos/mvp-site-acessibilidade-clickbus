# ClickBus Acessível — resumo para apresentação

Última atualização: 17 de setembro de 2026.

## Resumo executivo

O ClickBus Acessível é um MVP acadêmico que reproduz, com dados fictícios, uma jornada de compra de passagem rodoviária: busca, resultados, escolha de assento, dados do passageiro e confirmação simulada. O principal diferencial é um plugin lateral de acessibilidade que permite adaptar a leitura e a apresentação da interface sem alterar o fluxo principal.

A solução funciona localmente por meio de controles manuais, preferências persistentes, glossário e simplificações revisadas. O adaptador servidor para Gemini também está implementado e testado sem credencial real; conectividade e qualidade do modelo continuam pendentes de um smoke com segredo apenas no runtime. Para a Rybená, um token temporário vinculado ao domínio autorizado foi recebido; handler, URL e contrato do adaptador foram validados localmente, enquanto configuração na Vercel e o caminho navegador/CDN/player ainda estão `NOT RUN`.

## Estrutura sugerida para a apresentação

Cada seção abaixo pode ser usada como base para um slide.

### 1. Contexto e motivação

- Jornadas digitais podem apresentar barreiras de leitura, visualização e interação.
- Uma única configuração de interface não atende igualmente todas as pessoas.
- O projeto explora como oferecer personalização acessível sem interferir na jornada comercial.

**Mensagem principal:** acessibilidade é tratada como uma camada de autonomia para a pessoa usuária.

### 2. Objetivo do projeto

- Reproduzir a jornada principal da ClickBus em um ambiente acadêmico e controlado.
- Disponibilizar ajustes de acessibilidade simples, combináveis e reversíveis.
- Preservar a identidade visual, o conteúdo original e o estado da jornada.
- Preparar a arquitetura para recursos opcionais de IA, voz e Libras.

**Mensagem principal:** o MVP combina uma experiência conhecida de viagem com recursos acessíveis que não dependem de serviços externos para funcionar.

### 3. Jornada demonstrada

| Etapa | Ação da pessoa usuária | Resultado |
| --- | --- | --- |
| Busca | Informa origem, destino e data | Lista de viagens fictícias |
| Resultados | Filtra e escolhe uma opção | Mapa de assentos |
| Assento | Seleciona um lugar disponível | Formulário de passageiro |
| Passageiro | Preenche e valida os dados | Avanço da simulação |
| Confirmação | Conclui o fluxo | Confirmação apenas visual |

O cenário principal utiliza a rota fictícia São Paulo–Rio de Janeiro. Não há consulta de disponibilidade, reserva, emissão de bilhete ou pagamento real.

### 4. Solução de acessibilidade

O plugin lateral acompanha todas as etapas e reúne três áreas: conversa, ajustes e conteúdo.

- Escala de texto, alto contraste, controles e cursor ampliados.
- Destaque de links e títulos.
- Espaçamento entre letras, entrelinha e alinhamento.
- Guia e máscara de leitura, além de redução de movimento.
- Preset de leitura confortável, restauração e desfazer.
- Preferências salvas localmente no navegador.

No desktop, o painel é uma região lateral não modal. No mobile, funciona como diálogo modal com controle de foco e fechamento por `Escape`.

### 5. Apoio à compreensão do conteúdo

- Um glossário local explica termos da jornada.
- Trechos públicos selecionados possuem versões simplificadas e revisadas.
- A explicação ou simplificação é exibida separadamente, sem substituir o texto original.
- A seleção de texto ocorre somente em modo explícito e dentro de áreas públicas autorizadas.
- Dados de passageiro, checkout, preços, bilhetes e confirmação ficam fora dessas ferramentas.

**Diferencial:** o conteúdo original permanece disponível e nenhuma seleção de texto pode disparar ações na jornada.

### 6. Papel da inteligência artificial

A IA foi projetada apenas como planejadora: interpreta um pedido em linguagem natural e devolve um plano limitado a ações conhecidas. Um executor local valida esse plano antes de aplicar qualquer ajuste.

- A IA não acessa o DOM, não navega e não executa CSS ou JavaScript.
- Não compra, reserva, cancela ou altera dados da jornada.
- Pedidos vagos podem exigir confirmação antes de qualquer mudança.
- Sem provedor configurado, o sistema informa indisponibilidade e mantém os controles manuais funcionando.

Nesta versão, o caminho técnico usa o endpoint REST nativo do Gemini, resposta JSON e validação local. Os testes provam o protocolo e as falhas com transporte falso; não provam inferência real, que ainda não foi executada nem ativada em produção.

### 7. Libras e Rybená

- A autorização de uso gratuito da Rybená foi confirmada.
- Um token temporário vinculado ao domínio autorizado foi recebido fora do repositório.
- O projeto já possui um contrato de integração e uma área de atribuição na interface.
- Sob ação explícita, o loader consulta `GET /api/accessibility/rybena`; o endpoint lê `RYBENA_ACCESS_TOKEN` somente no servidor e responde `no-store` com a URL validada do CDN em `mode=api` e `doNotTrack=true`.
- O endpoint aceita somente HTTPS no hostname autorizado; aliases e previews são recusados. A requisição de configuração expira em 10 s, e download/preparação do player em 15 s por etapa.
- A credencial ainda não foi configurada na Vercel e nenhum deploy/smoke foi executado. O teste histórico em localhost foi recusado e pode continuar assim por não ser o domínio vinculado.

**Estado correto:** handler, URL e contrato do adaptador validados localmente; fetch no navegador, injeção da tag, CDN/player no domínio autorizado ainda `NOT RUN`; qualidade linguística não homologada.

### 8. Arquitetura e tecnologias

- React 18 e TypeScript em modo estrito.
- Vite 6 para desenvolvimento e build.
- CSS organizado por tokens, base global e componentes.
- Lucide React para ícones e fontes locais Rubik e Roboto Mono.
- Máquina de estados linear, sem React Router: busca → resultados → assentos → passageiro → confirmação.
- Funcionalidades separadas por domínio e dados fictícios centralizados.

O núcleo de acessibilidade é determinístico, reversível e independente da disponibilidade de IA ou Rybená.

### 9. Validação e resultados registrados

Estado documentado em 17 de setembro de 2026:

- TypeScript e build de produção aprovados.
- 24 testes locais do núcleo de acessibilidade aprovados, incluindo adaptador Gemini, handler/URL Rybená e contrato do adaptador com doubles explícitos; eles não exercitam injeção DOM nem player real.
- Interface verificada em 1440×900, 390×844 e 320×844 pixels CSS.
- Texto a 150% e alto contraste sem rolagem horizontal em mobile.
- Comportamento modal e não modal validado no limite entre 820 e 821 pixels.
- Fluxos locais de seleção, glossário e simplificação aprovados.
- Ausência de VLibras confirmada; Rybená só é carregada após ação explícita.

Esses resultados validam a implementação observada, mas não representam certificação integral de acessibilidade.

### 10. Limitações e próximos passos

Limitações atuais:

- adaptador Gemini implementado, mas chave ausente do runtime e smoke/avaliação real ainda não executados;
- quota/budget do Google e rate limit persistente/WAF ainda precisam ser configurados antes de exposição pública;
- configuração de `RYBENA_ACCESS_TOKEN` na Vercel, deploy e smoke Rybená ainda `NOT RUN`; homologação com pessoas surdas sinalizantes permanece pendente;
- voz real ainda não validada nesta rodada;
- testes com NVDA/VoiceOver, pessoas usuárias, Safari/iOS e zoom de 200% pendentes.

Próximos passos:

- configurar o segredo Gemini somente no runtime do projeto Vercel escolhido, com quota e alerta de custo;
- executar um smoke e validar o planejador com a matriz de pedidos reais;
- configurar a credencial temporária somente no projeto/ambiente Vercel do domínio autorizado, executar smoke sem registrar a URL tokenizada, remover/rotacionar ao expirar e homologar a Rybená;
- realizar testes com leitores de tela e pessoas usuárias, incluindo pessoas surdas sinalizantes;
- repetir a regressão completa da jornada após novas integrações.

## Encerramento sugerido

O ClickBus Acessível demonstra que uma jornada digital pode receber recursos de personalização e apoio à leitura sem perder sua identidade nem depender totalmente de IA. O MVP entrega uma base local funcional, mantém limites técnicos transparentes e deixa um caminho seguro para evoluções futuras.

## Cuidados ao apresentar

Evite afirmar que o projeto:

- realiza vendas, reservas ou pagamentos reais;
- possui IA real ativa em produção;
- oferece tradução real em Libras já operacional ou homologada;
- é integralmente compatível ou certificado pela WCAG;
- foi validado com leitores de tela ou pessoas usuárias quando esses testes ainda estão pendentes.

## Fontes para aprofundamento

- [PRD do agente de acessibilidade](accessibility-agent/PRD.md)
- [Arquitetura técnica do agente](accessibility-agent/SDD.md)
- [Estado da implementação](accessibility-agent/IMPLEMENTATION.md)
- [Matriz de validação](accessibility-agent/VALIDATION.md)
- [Arquitetura geral](guides/01-ARQUITETURA.md)
- [Dados fictícios da jornada](../app/src/data/trips.ts)
