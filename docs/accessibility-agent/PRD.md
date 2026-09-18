# PRD — Acessibilidade Assistida por IA

Versão 2.2 · 17 de setembro de 2026 · Projeto acadêmico FIAP / ClickBus.

## 1. Visão e estado da entrega

Permitir que cada pessoa ajuste a apresentação e a leitura da réplica ClickBus por controles manuais ou linguagem natural. A IA planeja somente ações tipadas; um executor local valida e aplica ferramentas previamente implementadas. O produto não é um chatbot de vendas e não busca, reserva, paga, cancela ou modifica a jornada comercial.

A réplica e sua identidade visual são a aplicação hospedeira e devem ser preservadas. O produto é uma camada independente da jornada, com preferências persistentes, mudanças reversíveis, explicação de termos, simplificação segura de trechos públicos e entrada opcional por voz.

## 2. Estado autoritativo da Rybená

- A parceria e a autorização de uso gratuito estão confirmadas, condicionadas à divulgação da parceria.
- A documentação pública passou a fornecer o script CDN, o modo `api` e os métodos de player, tradução, reprodução, velocidade e eventos.
- A entrega possui um `RybenaBrowserAdapter` isolado, carregado somente após ação explícita e configurado com `doNotTrack="true"`.
- O teste real em `127.0.0.1` carregou o fornecedor, mas a Rybená recusou a origem com **“Token Rybená não autorizado”**; tradução e reprodução continuam não validadas.
- O estado inicial é `idle`; carregamento autorizado pode avançar para `ready`, enquanto domínio/token recusado termina em `failed` com mensagem explícita.

A falha de autorização não gera polling ou retry automático e não bloqueia as ferramentas próprias, o painel, a persistência, a IA, a explicação, a simplificação ou a voz.

## 3. Objetivos

1. Tornar ajustes independentes fáceis de encontrar e combinar sem exigir conversa.
2. Permitir pedidos naturais com confirmação proporcional à ambiguidade.
3. Garantir que somente ações enumeradas e valores válidos possam ser executados.
4. Preservar estado comercial, conteúdo original, privacidade e foco.
5. Integrar somente os métodos publicados da Rybená, sem apresentar doubles ou falhas de autorização como tradução.

Não são resultados comprovados desta entrega: ganho de conversão, redução de abandono, conformidade integral, qualidade linguística de Libras ou superioridade do agente. Esses resultados exigem avaliação posterior.

## 4. Ferramentas próprias obrigatórias

### Apresentação

- escala de texto: `100%`, `112,5%`, `125%` e `150%`;
- contraste: padrão ou alto;
- controles: padrão ou grandes;
- cursor: padrão ou grande;
- destaque de links: desligado ou ligado;
- destaque de títulos: desligado ou ligado.

### Leitura

- espaçamento entre letras: padrão ou ampliado;
- altura de linha: padrão, confortável ou ampla, independente das letras;
- alinhamento: original, esquerda ou centro;
- guia de leitura;
- máscara de leitura.

### Conforto

- redução de movimento;
- preset “Leitura confortável”, que aplica um patch explícito e revisável, sem diagnóstico: texto `112,5%`, letras ampliadas, altura confortável, alinhamento à esquerda e movimento reduzido. Preferências não citadas permanecem como estavam.

Guia e máscara não interceptam cliques, não escondem o foco e respondem também ao teclado. Escala de texto não é apresentada como zoom da página. Não usar filtros globais indiscriminados, CSS livre do modelo ou mudanças que escondam informação essencial.

## 5. Experiência do painel

O acionador “Acessibilidade” é um plugin fixo na lateral esquerda, fora do header, acompanha todas as etapas da jornada e abre um painel com:

- conversa textual e histórico curto somente em memória;
- ajustes manuais organizados por Apresentação, Leitura e Conforto;
- resumo das preferências ativas;
- proposta, confirmação, cancelamento e desfazer;
- explicação de termos e simplificação de trechos;
- entrada opcional por voz com transcrição editável;
- área de Libras/Rybená com carregamento sob demanda, falha segura e atribuição visível.

Pedidos explícitos e reversíveis podem ser aplicados diretamente. Pedidos vagos geram proposta explicada sem alterar a página. Não inferir idade, deficiência ou diagnóstico.

Fechar o painel preserva preferências, interrompe captura/mídia, cancela requisições e propostas e invalida respostas tardias. No desktop o painel é lateral e não modal; no mobile é modal, com foco contido, Escape e retorno ao acionador. O modo explícito “Selecionar na página” recolhe temporariamente o painel e libera a página; ao concluir ou cancelar, o painel retorna e o foco volta ao campo do termo.

## 6. Planejamento por IA e execução

O modelo recebe apenas mensagem, preferências, capacidades, revisões, metadados mínimos da página e no máximo seis mensagens curtas de contexto. Não recebe DOM, screenshots, formulários, passageiro, pagamento, bilhetes ou dados privados.

O servidor e o cliente validam schemas de runtime com chaves fechadas. Ações suportadas:

- `set_preferences`;
- `apply_comfortable_reading`;
- `undo_preferences`;
- `reset_preferences`;
- `open_libras`, `close_libras`, `translate_content`, `pause_libras`, `resume_libras`, `stop_libras`, `set_libras_speed` — mapeados para a API documentada e aceitos somente quando o runtime autorizado estiver pronto.

IDs, revisões e contexto são revalidados antes de executar. Lotes inválidos não produzem efeitos. `planId` é idempotente. Confirmações são derivadas de recibos do executor, nunca da frase otimista do modelo.

Se não houver provedor configurado, a interface informa indisponibilidade temporária da IA e mantém todas as ferramentas manuais. Não há fallback pago escolhido silenciosamente.

## 7. Explicação e simplificação

Explicação usa um termo e pequeno contexto público autorizado. O termo pode ser digitado em campo operável por teclado ou capturado no modo explícito de seleção por mouse/toque. A seleção aceita de 2 a 120 caracteres somente quando começa e termina no mesmo alvo público registrado. Um glossário revisado responde diretamente a termos da jornada. Quando a informação não está no contexto, o sistema reconhece o limite e não inventa regras de tarifa, cancelamento, remarcação ou reembolso.

Simplificação aceita apenas trechos públicos registrados pelo adaptador, com limite de 1.500 caracteres. Os alvos iniciais possuem versões simples revisadas e respondem localmente, sem depender de IA. Um provedor configurado pode atender futuramente um alvo autorizado sem versão local, mas sua saída deve ser identificada de acordo com a origem real. Em ambos os casos, o resultado aparece separado, o original permanece disponível e o texto da página nunca é substituído. Conteúdo selecionado é dado não confiável e não pode disparar ferramentas.

Primeiros alvos: ajuda da busca, comparação de resultados, classe de serviço e instruções do mapa. Excluir dados pessoais, bilhetes, preços, regras contratuais e condições específicas.

## 8. Voz

- início e parada por botões explícitos;
- indicador perceptível de microfone ativo;
- transcrição editável;
- confirmação antes de enviar;
- mesma entrada textual e mesmo executor;
- alternativa textual sempre disponível.

Não há escuta contínua, palavra de ativação ou gravação automática. Em navegador sem `SpeechRecognition`, o painel informa a limitação. O reconhecimento do navegador pode processar áudio remotamente; isso deve estar visível antes do uso.

## 9. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| FR01 | Acionador e painel | Plugin lateral persistente fora do header, operável por teclado, responsivo e com retorno de foco |
| FR02 | Ferramentas próprias | Todos os ajustes discretos funcionam individualmente e em combinação |
| FR03 | Preset | Patch explícito preserva preferências não mencionadas |
| FR04 | Persistência e migração | v1 e v2 legados migram para v3; storage bloqueado funciona em memória |
| FR05 | Desfazer | Restaura a última transação visual efetiva; no-op não perde snapshot |
| FR06 | Planejador | Saída tipada válida; indisponibilidade não bloqueia controles manuais |
| FR07 | Propostas | Pedido vago não altera estado antes da confirmação |
| FR08 | Concorrência | Resposta tardia, repetida ou obsoleta não executa |
| FR09 | Escopo | Pedido comercial, código ou ação desconhecida não modifica a jornada |
| FR10 | Explicação | Termo/contexto mínimo; seleção restrita a alvo público; limite reconhecido |
| FR11 | Simplificação | Somente alvo permitido; versão local revisada quando disponível; resultado separado e sem nova informação |
| FR12 | Voz | Captura explícita, transcrição editável e confirmação; fallback textual |
| FR13 | Libras preparado | Contrato genérico, adaptador isolado, carregamento sob demanda e falha segura |
| FR14 | Rybená atribuída | Crédito e link legíveis, sem alegar integração operacional |
| FR15 | Preservação | Busca, viagem, assento, passageiro, preço e navegação não são alterados pelo agente |
| FR16 | Fechamento seguro | Cancela solicitações/propostas/voz e impede efeitos tardios |

## 10. Requisitos não funcionais

- Referência WCAG 2.2 AA nos fluxos tocados, sem alegação de certificação.
- Uso em 320 CSS px, zoom 200% e reflow equivalente quando viável.
- Ajustes locais perceptíveis em até 200 ms no ambiente de referência.
- Mensagem até 1.000 caracteres, corpo HTTP até 16 KiB, uma requisição ativa, timeout de 12 s e nenhuma repetição paga automática.
- Preferências são a única informação persistida; conversa, voz, seleção e conteúdo não são persistidos.
- Chaves somente no servidor, nunca em `VITE_*`, bundle, respostas ou logs.
- Endpoint de inferência fica desabilitado em hospedagem pública até existir proteção de abuso/quota adequada.

## 11. Fora da entrega

Navegação facial; reconhecimento de Libras por câmera; lupa sob cursor; “modo dislexia” terapêutico; correção automática de daltonismo; reorganização livre por IA; cores arbitrárias; saturação; contraste invertido; descrição automática de imagens; RAG; banco vetorial; treinamento; multiagentes; banco de conversas; integração comercial real.

Descrição de imagens fica apenas em avaliação. Imagens conhecidas da réplica devem ter alternativas revisadas; não deduzir preço, disponibilidade ou dados já estruturados por visão.

## 12. Definição de concluído

### Núcleo de acessibilidade e IA

Pode ser concluído quando ferramentas, store, executor, painel, explicação, simplificação, voz e recuperação de indisponibilidade estiverem implementados e os testes independentes de fornecedor passarem. A integração real com o modelo permanece “configuração pendente” se não houver credenciais/provedor disponíveis.

### Rybená

Nesta entrega só pode ser descrita como: **“Integração demonstrativa implementada; domínio/token e tradução real ainda não validados.”**

O carregamento do script e a recusa real de autorização foram observados. Envio aceito, tradução, player, pausa, retomada, parada, velocidade e eventos permanecem **BLOCKED / NOT VALIDATED — provider domain or token not authorized**.
