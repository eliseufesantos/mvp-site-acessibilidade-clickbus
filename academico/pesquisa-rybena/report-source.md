# Pesquisa de Produto Rybená

## Funcionamento arquitetura mercado riscos e proposta de MVP acadêmico para a FIAP

**Projeto** ClickBus FIAP  
**Data de referência** 6 de setembro de 2026  
**Natureza** pesquisa acadêmica e benchmark de produto  
**Escopo geográfico** Brasil  
**Status** versão consolidada com base em fontes públicas

<!-- pagebreak -->

## Resumo executivo

A Rybená é uma plataforma brasileira de tecnologia assistiva que combina três propostas em uma mesma oferta: tradução de português para Libras por avatar 3D, leitura de texto por voz e um conjunto de ajustes de acessibilidade para interfaces digitais. A empresa se apresenta como originada em 2003 e constituída em 2019. Hoje vende assinaturas B2B para sites e oferece soluções para aplicativos, documentos, APIs, ambientes offline, intranets, painéis, terminais de autoatendimento e vídeos. Também distribui gratuitamente um aplicativo móvel para Android e iOS. Essas informações são confirmadas pelo [site institucional](https://www.rybena.com.br/), pela página de [soluções](https://www.rybena.com.br/solucoes/) e pela seção [sobre a empresa](https://www.rybena.com.br/sobre/).

O produto não deve ser entendido apenas como um “tradutor de Libras”. Comercialmente, a Rybená opera como uma camada de acessibilidade para organizações: fornece código de integração, processamento remoto, avatar, painel de recursos visuais, suporte e customização. No aplicativo, a experiência é centrada no avatar e em dois caminhos principais: texto para Libras e voz para Libras. As lojas também mencionam controle de velocidade, exportação de vídeo e personalização de tema. A reconstrução de fluxo apresentada neste relatório vem da [listagem do Google Play](https://play.google.com/store/apps/details?id=com.rybena.app), da [App Store](https://apps.apple.com/br/app/ryben%C3%A1-tradutor-de-libras/id6748836003) e de suas capturas oficiais; não é um teste de caixa-preta do aplicativo instalado.

Tecnicamente, as evidências públicas apontam para uma arquitetura híbrida. O navegador ou aplicativo captura texto ou voz, envia conteúdo a serviços da Rybená, recebe uma representação da tradução e a renderiza no avatar. A documentação cita tradução neural, recursos carregados sob demanda, integração por CDN e API, além de “frames de vetorização” retornados ao cliente. Há uma rota paralela de síntese de voz. Ajustes como contraste, tipografia, cursor e realce são aplicados no cliente. A arquitetura exata, os modelos, os dados de treinamento e o dicionário proprietário não são públicos; qualquer diagrama interno deve ser tratado como inferência.

Para o trabalho da FIAP, a recomendação é fazer um benchmark funcional e uma implementação independente, não uma cópia literal. O grupo pode reproduzir a classe de problema, as jornadas e princípios de interação, mas deve usar marca, interface, avatar, textos, código e ativos próprios. Uma rota de menor risco é integrar a camada aberta do [VLibras](https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/vlibras/vlibras) e construir uma experiência original voltada ao contexto ClickBus: comunicação de embarque, alteração de plataforma, atraso, conexão e emergência em texto, voz e Libras.

Os principais alertas são quatro. Primeiro, tradução automática de Libras não equivale a acessibilidade integral nem comprova conformidade com WCAG. Segundo, a qualidade linguística precisa ser validada com pessoas surdas sinalizantes e especialistas em Libras. Terceiro, há inconsistências públicas de privacidade entre os termos e as declarações das lojas. Quarto, há código, marca, avatar e propriedade intelectual próprios; um projeto comercial exigiria revisão jurídica e de licenças.

## Decisão recomendada

**Construir um MVP inspirado no problema, não na expressão do produto.** O primeiro corte deve permitir que uma pessoa escolha ou dite uma mensagem de viagem, visualize a tradução em Libras, controle a reprodução e compartilhe ou apresente a mensagem. O núcleo precisa funcionar com teclado, leitor de tela, contraste adequado e linguagem simples. Recursos de alto risco — tradução livre de qualquer frase, geração de avatar próprio, modo offline abrangente e IA generativa para conteúdo sensível — devem entrar apenas depois de validação técnica, linguística e jurídica.

<!-- pagebreak -->

## Escopo e método

Esta pesquisa responde a cinco perguntas:

1. O que a Rybená oferece e para quem
2. Como o aplicativo e a plataforma web funcionam
3. Qual arquitetura pode ser inferida das evidências públicas
4. Quais limites legais, éticos e de acessibilidade afetam um produto semelhante
5. Como transformar os aprendizados em um MVP original para a FIAP

Foram priorizadas fontes primárias: site e documentação da Rybená, páginas oficiais das lojas, legislação federal, normas publicadas por órgãos públicos, W3C e páginas governamentais do VLibras. Fontes acadêmicas foram usadas para avaliar limitações de avatares. Fontes secundárias serviram apenas como apoio. Alegações de alcance, disponibilidade, clientes e desempenho publicadas pela própria empresa são identificadas como autodeclaradas.

| Tema | Evidência principal | Confiança | Limite |
|---|---|---|---|
| Portfólio e recursos | Site e documentação oficiais | Alta | Marketing não equivale a auditoria independente |
| Fluxo do app | Lojas e capturas oficiais | Média alta | Aplicativo não foi executado nesta pesquisa |
| Arquitetura interna | Documentação, termos e API | Média | Modelos e infraestrutura não são públicos |
| Qualidade da tradução | Estudo acadêmico de 2018 | Média baixa para o produto atual | Amostra de cinco pessoas e versão antiga |
| Mercado potencial | IBGE e estimativa da empresa | Média | Públicos se sobrepõem e não são uma base única |
| Situação de propriedade intelectual | Termos, legislação e publicação histórica | Média | Não é parecer jurídico nem busca de liberdade de operação |

A pesquisa foi encerrada quando houve evidência primária suficiente para descrever produto, canais, integração, preços, privacidade, normas e proposta de MVP. Permanecem fora do alcance: avaliação prática da versão atual do app, precisão real de tradução, detalhes do treinamento de modelos, contratos comerciais completos e situação jurídica atual de cada ativo de propriedade intelectual.

## A empresa e a proposta de valor

Segundo a [história institucional](https://www.rybena.com.br/sobre/), a iniciativa surgiu em 2003 de uma colaboração entre o DFJUG e o Instituto CTS, e a Rybená Tecnologias Assistivas foi constituída em 2019. A proposta evoluiu de um tradutor de Libras para uma suíte mais ampla. Em 2022, a empresa relata ter expandido o módulo de acessibilidade, adotado um avatar mais humanizado e ampliado a leitura por voz para mais idiomas.

A página inicial resume a oferta como acessibilidade para “sites, apps e documentos”, com avatar 3D de Libras, voz neural e mais de trinta recursos. A empresa divulga disponibilidade de 99,9%, presença em mais de mil sites e alcance potencial de 66 milhões de pessoas. Esses números devem ser registrados como [alegações da própria Rybená](https://www.rybena.com.br/), sem validação independente neste trabalho.

O valor entregue ao cliente corporativo é composto por:

- redução do esforço de integrar tradução e ferramentas de acessibilidade
- uma experiência de marca customizável em planos superiores
- suporte e atualização centralizada pelo fornecedor
- aplicação em múltiplos canais, inclusive ambientes internos e equipamentos físicos
- argumento de conformidade com legislação e padrões de acessibilidade

O comprador provável é uma organização que mantém canais digitais de grande alcance ou possui obrigação elevada de atendimento inclusivo: bancos, órgãos públicos, tribunais, educação, saúde, varejo e serviços. A presença de páginas de contratos públicos, como o [Contrato 22 de 2026 do Ministério da Cultura](https://www.gov.br/cultura/pt-br/acesso-a-informacao/licitacoes-e-contratos/contratos1/2026/contrato-administrativo-no-22-2026-rybena-tecnologias-assistivas-ltda/), confirma o uso institucional.

## Portfólio e modelo de negócio

A [página de soluções](https://www.rybena.com.br/solucoes/) lista nove linhas:

| Solução | Papel no portfólio | Forma de uso provável |
|---|---|---|
| Web | Traduz seleção de texto e aplica ajustes de acessibilidade | Script CDN, plugins ou integração própria |
| App | Comunicação entre pessoas ouvintes e surdas | Android e iOS gratuitos |
| Documentos | Acesso a conteúdo documental | Fluxo adaptado ao leitor de documento |
| API | Componentes para experiências personalizadas | Métodos JavaScript e serviços remotos |
| Offline | Uso sem conexão em cenários delimitados | Pacote local ou conteúdo pré-processado |
| Intranet | Acessibilidade em ambientes corporativos fechados | Implantação controlada |
| Painéis | Comunicação em sinalização digital | Player integrado ao conteúdo do painel |
| ATM | Atendimento em terminais de autoatendimento | Integração embarcada e interface adaptada |
| Vídeo | Janela de Libras produzida para conteúdo audiovisual | Intérprete humano e captura de movimento |

O site separa uma oferta padronizada e outra customizável. Na consulta realizada em setembro de 2026, a [página de planos](https://www.rybena.com.br/planos/) exibia o plano Básico por R$ 715 mensais para um domínio e o Customizável por R$ 1.100 mensais, também para um domínio. O segundo inclui identidade visual da organização. A página inicial oferece teste de sete dias sem cartão e informa liberação comercial em até um dia útil. Valores e condições podem mudar e devem ser revalidados antes de qualquer comparação financeira.

O modelo combina assinatura recorrente B2B, customização, projetos especiais e distribuição gratuita do app como canal de impacto e aquisição de marca. Os termos do aplicativo também preveem anúncios, compras internas e possibilidade de recursos pagos, embora as lojas atualmente o apresentem como gratuito.

## Como funciona o aplicativo móvel

### Proposta central

O aplicativo móvel é descrito como um tradutor de português para Libras voltado à comunicação entre pessoas ouvintes e surdas. A listagem do Google Play informa entrada por texto e voz. O histórico de versões menciona exportação de vídeo, ajuste de velocidade e personalização de tema. A [App Store](https://apps.apple.com/br/app/ryben%C3%A1-tradutor-de-libras/id6748836003) mostra o lançamento em agosto de 2025 e compatibilidade a partir do iOS 13.

### Jornada reconstruída

Com base nas capturas oficiais, o fluxo mais provável é:

1. Abertura com tela de marca
2. Entrada na experiência centrada em um avatar 3D
3. Escolha entre modo Libras por texto e modo Libras por voz
4. Digitação, colagem ou fala da mensagem
5. Processamento e geração de uma sequência de sinais
6. Reprodução no avatar com controle de velocidade
7. Pausa, repetição, compartilhamento ou exportação
8. Ajustes de aparência e preferências

Na interface observada, o avatar ocupa a maior parte da tela. Uma barra lateral direita apresenta atalhos de modo e microfone. A barra inferior reúne velocidade, edição de texto, reprodução, compartilhamento e configurações. A semântica exata de cada ícone é uma inferência visual; ela não foi confirmada por teste interativo.

### Estados essenciais do produto

| Estado | O que o usuário vê | Requisito para uma boa implementação |
|---|---|---|
| Pronto | Avatar e opção de texto ou voz | Foco inicial previsível e rótulos acessíveis |
| Capturando voz | Indicador de microfone ativo | Consentimento contextual e cancelamento claro |
| Processando | Progresso ou feedback | Não bloquear navegação e informar demora |
| Reproduzindo | Avatar sinaliza a mensagem | Pausa, repetição e velocidade ajustável |
| Termo desconhecido | Soletração manual ou aviso | Explicar limite e permitir correção |
| Erro de rede | Mensagem e alternativa | Repetir, digitar ou usar frase offline |
| Compartilhando | Prévia de saída | Confirmar conteúdo antes da exportação |

### Limitações observáveis

O aplicativo depende da capacidade do motor de interpretar português e produzir Libras adequada ao contexto. Português escrito e Libras têm gramáticas diferentes; uma troca palavra por palavra não é suficiente. Os próprios [termos do aplicativo](https://rybena.com.br/en/termos-app) reconhecem que traduções podem conter erros e recomendam validação com a comunidade surda ou intérprete quando necessário.

As lojas informam “nenhum dado coletado” segundo declaração do desenvolvedor, enquanto os termos dizem coletar texto soletrado e quantidade de traduções. Essa divergência precisa ser resolvida em um produto próprio. Além disso, a App Store informa que o desenvolvedor não declarou recursos nativos de acessibilidade, algo especialmente relevante para um aplicativo cuja finalidade é acessibilidade.

## Como funciona a solução web

A [documentação de início](https://docs.rybena.com.br/docs/getting-started) descreve um comportamento direto: o usuário seleciona texto da página e aciona Libras ou voz. Um script chamado `rybena.js` adiciona os controles ao site. Recursos pesados são carregados sob demanda, reduzindo o custo inicial. A integração é compatível com navegadores modernos, dispositivos móveis, frameworks, sistemas de gestão de conteúdo e aplicações de página única.

### Instalação e integração

A instalação padrão ocorre por um script servido pela CDN da empresa. É possível configurar posição do player, posição da barra, deslocamentos, tamanho, cor, índice de camada, idioma, modo completo ou API e botões desativados. A [documentação de instalação](https://docs.rybena.com.br/docs/getting-started/installation) afirma que a implantação básica leva poucos minutos.

A [página de integrações](https://docs.rybena.com.br/docs/integrations) cita WordPress, Joomla, Moodle, Wix, Google Tag Manager, Brightspace, aplicações nativas por WebView e integrações personalizadas. Conteúdo em `iframe`, como PDFs, exige que o script seja injetado no próprio contexto por causa da política de mesma origem. A [integração com PDF](https://docs.rybena.com.br/docs/getting-started/pdf-integration) captura a seleção dentro do visualizador, envia o texto ao serviço e exibe Libras ou voz.

### Barra de acessibilidade

O módulo documentado inclui:

- descrição de imagens com IA
- simplificação de texto e significado de palavras
- saturação alta, baixa e monocromática
- contraste escuro, claro e invertido
- máscara e guia de leitura, cursor grande e lupa
- espaçamento entre letras, altura de linha e fonte para dislexia
- zoom e alinhamento de texto
- realce de links e títulos
- pausa de animações, modo de leitura e dicionário
- aumento de botões, estrutura da página e navegação por teclado

Esses recursos atuam como preferências de apoio. Eles não corrigem automaticamente HTML sem semântica, ordem de foco incorreta, formulários sem rótulo, mídia sem legenda ou fluxos incompatíveis com leitor de tela.

### API pública documentada

A [API JavaScript](https://docs.rybena.com.br/docs/api) expõe uma instância única que permite abrir e fechar o player, alternar Libras e voz, traduzir texto, pausar, reproduzir, parar, mudar velocidade e controlar posição e tamanho. A licença precisa estar válida. O modo API elimina a barra padrão e dá ao produto cliente controle sobre a experiência. Isso permite incorporar tradução em vídeo, cursos, totens ou jornadas próprias.

Preferências visuais também podem ser acionadas por API. A documentação recomenda persistir o estado no armazenamento local do navegador. Assim, a Rybená combina um serviço central de tradução com uma camada de interface executada no canal do cliente.

## Arquitetura provável

O fluxo a seguir é uma reconstrução baseada em documentação e termos públicos, não uma descrição oficial completa da infraestrutura.

| Etapa | Componente provável | Evidência |
|---|---|---|
| Entrada | Texto selecionado, digitado ou reconhecido de voz | App e documentação de uso |
| Preparação | Normalização, segmentação e identificação de idioma | Necessidade técnica inferida |
| Tradução | Modelo neural e regras linguísticas para português e Libras | Termos e material institucional |
| Resolução lexical | Busca de sinais e soletração quando não há sinal | Política de dados sobre palavras soletradas |
| Serialização | Sequência de sinais ou frames vetoriais | Termos de uso |
| Apresentação | Renderizador do avatar 3D | Produto observado |
| Controle | Reproduzir, pausar, velocidade, posição e tamanho | API documentada |
| Rota paralela | Síntese neural de voz em português, espanhol ou inglês | Documentação oficial |
| Apoio visual | Transformações de DOM e CSS no cliente | Natureza dos recursos de acessibilidade |

### Fluxo lógico recomendado para leitura

**Texto ou voz → reconhecimento de fala → normalização → tradução contextual → dicionário de sinais → tratamento de termo desconhecido → sequência de animação → player 3D → reprodução e compartilhamento**

A solução web carrega a estrutura mínima inicialmente e busca recursos mais pesados quando o usuário abre o player. O processamento de tradução envolve comunicação com servidores da Rybená. Para uma implementação própria, devem ser separados quatro domínios: captura, motor linguístico, renderização e experiência acessível. Essa separação permite substituir o motor sem reescrever o produto.

## Público e mercado

A Rybená agrega vários públicos: pessoas surdas, com baixa visão, idosas, com baixa alfabetização, dislexia e outras necessidades. O número de 66 milhões divulgado pela empresa não deve ser lido como contagem de pessoas únicas, porque os grupos se sobrepõem e a própria empresa observa essa sobreposição.

O [Censo 2022 do IBGE](https://educa.ibge.gov.br/criancas/voce-sabia/23239-deficiencia.html) estimou 14,4 milhões de pessoas com deficiência na população de dois anos ou mais analisada, enquanto a [PNAD Contínua 2022](https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102013_informativo.pdf) estimou 18,6 milhões. As metodologias são diferentes e não devem ser somadas. Para o projeto, o ponto relevante é que a demanda é material e heterogênea; segmentação por tarefa é mais útil do que um total genérico.

No contexto de viagens rodoviárias, os momentos de maior valor são aqueles com urgência, ruído, mudança operacional e assimetria de informação: compra, confirmação, chegada ao terminal, identificação da plataforma, embarque, conexão, atraso, cancelamento, bagagem e emergência.

## Concorrentes e alternativas

| Produto | Força principal | Modelo | Diferença para o projeto FIAP |
|---|---|---|---|
| Rybená | Suíte B2B de acessibilidade, Libras, voz e customização | Assinatura e projetos | Referência funcional central |
| Hand Talk | Aplicativo popular, personagens e aprendizagem | App e soluções corporativas | Forte experiência de consumidor e conteúdo educacional |
| VLibras | Infraestrutura pública, gratuita e aberta | Software e APIs públicas | Melhor base inicial para protótipo independente |
| Intérprete humano remoto | Precisão contextual e negociação de sentido | Serviço por sessão | Recomendado para situações críticas, maior custo e espera |
| Conteúdo pré-gravado | Alta qualidade para mensagens estáveis | Produção de mídia | Ótimo para avisos críticos e frases recorrentes |

O [Hand Talk](https://www.handtalk.me/br/aplicativo/) comunica mais de dez milhões de downloads, tradução para Libras e ASL, modo offline, personagens Hugo e Maya, ajuste de velocidade, dicionário e trilha educacional. O [VLibras](https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/vlibras/vlibras) é uma suíte pública e de código aberto para tradução de conteúdo digital. Seu [catálogo de APIs](https://www.gov.br/conecta/catalogo/apis/vlibras) descreve operações de texto para glosa, glosa para vídeo, regionalismos e dicionário de sinais.

A escolha não precisa ser binária. Um produto seguro pode usar mensagens críticas previamente validadas e recorrer à tradução automática para conteúdo variável, apresentando claramente o nível de confiança e um caminho para atendimento humano.

## Evidência acadêmica e qualidade linguística

Um estudo de 2018 sobre a usabilidade de avatares de Libras em sites avaliou cinco participantes surdos com rastreamento ocular e encontrou problemas de localização do avatar, interação e satisfação com a tradução. O artigo conclui que a simples presença do avatar não garante inclusão. A amostra é pequena e a versão estudada é antiga, mas o trabalho oferece um alerta válido sobre validação com usuários. Consulte o [artigo em acesso aberto](https://doi.org/10.23972/det2018iss16pp41-51).

Uma revisão liderada por pesquisadores surdos sobre IA para línguas de sinais identifica riscos sistêmicos: bases pouco representativas, pouca incorporação de linguística de línguas de sinais e participação insuficiente de comunidades surdas. A publicação está disponível no [repositório arXiv](https://arxiv.org/abs/2403.02563). A consequência para o projeto é metodológica: pessoas surdas não podem aparecer apenas no teste final; devem participar da definição, prototipação e avaliação.

Qualidade deve ser medida em três níveis:

- **linguístico** fidelidade de sentido, gramática de Libras, expressões não manuais e regionalismo
- **interacional** descoberta dos controles, legibilidade do avatar, velocidade e recuperação de erros
- **funcional** conclusão da tarefa real, como localizar a plataforma correta ou entender um cancelamento

Para mensagens de segurança, direitos, pagamento, cancelamento ou emergência, a tradução automática não deve ser a única fonte. Use conteúdo previamente revisado por especialista ou atendimento humano.

## Legislação e normas

A [Lei Brasileira de Inclusão](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm), Lei 13.146 de 2015, exige acessibilidade em sites mantidos por empresas com sede ou representação comercial no Brasil e por órgãos públicos, conforme melhores práticas e diretrizes internacionais. A [Lei 10.436 de 2002](https://planalto.gov.br/ccivil_03/leis/2002/l10436.htm) reconhece Libras como meio legal de comunicação e expressão e explicita que Libras possui estrutura gramatical própria. O [Decreto 5.626 de 2005](https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/decreto/d5626.htm) regulamenta a lei e estabelece obrigações em educação e atendimento público.

A referência internacional atual é a [WCAG 2.2](https://www.w3.org/TR/WCAG22/), recomendação do W3C desde outubro de 2023. Conformidade AA requer que todos os critérios de níveis A e AA aplicáveis sejam satisfeitos em páginas completas. Portanto, instalar uma barra de acessibilidade não demonstra, por si só, conformidade. Essa conclusão decorre do modelo de conformidade da WCAG.

No Brasil, a [ABNT NBR 17225 de 2025](https://www2.camara.leg.br/a-camara/estruturaadm/gestao-na-camara-dos-deputados/responsabilidade-social-e-ambiental/acessibilidade/pdfs/ABNTNBR17225AcessibilidadeDigitalparaWeb.pdf) trata de acessibilidade para conteúdo e aplicações web e se baseia na WCAG 2.2. Para aplicativos móveis, a Câmara dos Deputados lista a [ABNT NBR 17060 de 2022](https://www2.camara.leg.br/a-camara/estruturaadm/gestao-na-camara-dos-deputados/responsabilidade-social-e-ambiental/acessibilidade/normas-da-abnt-1). O produto acadêmico deve usar WCAG 2.2 AA como referência de desenvolvimento, complementada pelas normas brasileiras relevantes.

## Privacidade e segurança

A [política técnica de privacidade](https://docs.rybena.com.br/docs/getting-started/data-privacy) afirma que o serviço web coleta anonimamente apenas palavras soletradas quando não existe sinal, sem IP, site, informação pessoal, frases completas, números, contexto, histórico ou cookies. A opção `doNotTrack` desativa essa coleta. A [política LGPD](https://docs.rybena.com.br/docs/legal/politica-privacidade-lgpd) menciona retenção máxima de noventa dias para palavras soletradas, descarte do texto após tradução e manutenção de logs de sistema por pelo menos 365 dias.

Há, entretanto, pontos que precisam de esclarecimento:

- os termos gerais descrevem processamento de frases e possibilidade de persistência em logs quando a opção de não rastreamento não está ativa
- a documentação alterna os nomes `doNotTrack` e `notTrack`
- as lojas declaram que o app não coleta dados, mas os termos do app dizem coletar texto soletrado e contagem de traduções
- o endereço em português indicado pela loja retornou página inexistente durante a pesquisa, enquanto a versão sob `/en/termos-app` estava disponível em português

Para o MVP FIAP, a política recomendada é mais simples: não reter texto nem áudio por padrão, pedir permissão de microfone apenas no momento de uso, permitir apagar histórico local, documentar qualquer telemetria e remover identificadores de mensagens. Quando possível, usar reconhecimento de fala no dispositivo. Mensagens de viagem podem revelar localização, condição de saúde, deficiência, nome e identificador de reserva; por isso, logs precisam de redução e prazo curto.

## Propriedade intelectual e limites de cópia

Os [termos do app](https://rybena.com.br/en/termos-app) afirmam que conteúdo, software, recursos, marcas, logotipos e ícones são proprietários. A [Lei 9.609 de 1998](https://planalto.gov.br/ccivil_03/leis/l9609.htm) protege a expressão de programas de computador. O [INPI](https://www.gov.br/inpi/pt-br/acesso-a-informacao/perguntas-frequentes/programas-de-computador) esclarece que ideias, isoladamente, não recebem a mesma proteção autoral do código que as concretiza. A [Lei 9.279 de 1996](https://www.planalto.gov.br/ccivil_03/leis/l9279.htm) também protege marcas e reprime atos capazes de criar confusão ou concorrência desleal.

Existe uma publicação histórica de pedido de patente, [BRPI0502931A](https://patents.google.com/patent/BRPI0502931A/pt), depositado em 2005, sobre método e sistema envolvendo texto, voz e Libras. A existência dessa publicação não permite concluir, sem busca jurídica especializada, qual é a situação atual, o alcance ou a aplicabilidade de eventuais direitos.

### O que pode ser aproveitado academicamente

- o problema de comunicação entre português e Libras
- requisitos gerais como entrada por texto e voz, reprodução, velocidade e histórico
- padrões públicos de acessibilidade e heurísticas de usabilidade
- APIs e software aberto usados conforme licença
- aprendizados documentados sobre jornadas e erros

### O que não deve ser copiado

- nome, logotipo, identidade visual e textos comerciais
- avatar, aparência, animações, imagens, ícones ou capturas da Rybená
- código JavaScript, aplicativo, modelos, dicionário ou dados proprietários
- organização visual reproduzida de modo capaz de causar associação ou confusão
- conteúdo obtido por scraping, descompilação ou contorno de controles técnicos

A prática indicada é um processo de implementação limpa: uma equipe registra requisitos observáveis e fontes; outra implementa com design, código e ativos originais; todas as dependências e licenças ficam documentadas. Para exploração comercial futura, é necessário parecer jurídico específico.

## Blueprint do produto acadêmico

### Visão

Criar uma camada de comunicação acessível para viagens rodoviárias que transforme avisos e mensagens operacionais em texto simples, voz e Libras. O produto deve reduzir ansiedade e erro em momentos críticos da jornada, integrando-se ao fluxo ClickBus sem tratar acessibilidade como um botão isolado.

### Problema

Pessoas surdas ou com diferentes necessidades de comunicação podem perder avisos de plataforma, atraso, conexão, alteração de veículo, documentos exigidos e emergência. Painéis, alto-falantes e atendimento verbal não são equivalentes. Aplicativos de tradução genérica também podem falhar no vocabulário e no contexto de viagem.

### Proposta de valor

“Entenda e comunique cada etapa da viagem no formato que funciona para você.”

### Personas de pesquisa

| Persona | Necessidade | Hipótese de solução |
|---|---|---|
| Viajante surdo sinalizante | Receber avisos em Libras e confirmar entendimento | Mensagens operacionais validadas e player de Libras |
| Viajante com baixa alfabetização | Compreender instruções curtas | Linguagem simples, voz e símbolos consistentes |
| Atendente do terminal | Comunicar rapidamente sem conhecer Libras | Catálogo de frases e tradução assistida |
| Operador da viagem | Publicar aviso para vários canais | Console que gera texto, áudio e Libras a partir de uma mensagem |
| Acompanhante | Compartilhar instrução acessível | Link ou vídeo curto com validade e contexto |

### Jornadas prioritárias

1. **Antes da viagem** escolher preferência de comunicação, revisar documentos e receber instruções acessíveis
2. **No terminal** escanear QR da viagem ou abrir o bilhete para ver plataforma, horário e estado em texto, voz e Libras
3. **Durante uma alteração** receber notificação multimodal e confirmar que foi compreendida
4. **No atendimento** selecionar uma frase pronta ou ditar texto para reprodução em Libras
5. **Em emergência** exibir mensagens previamente revisadas, nunca depender apenas de geração automática

### Especificações próprias que diferenciam o projeto

- modo viagem conectado ao bilhete e à situação operacional real
- QR em terminal para abrir diretamente o aviso acessível
- pacote offline de frases de embarque e emergência
- avisos críticos previamente validados por pessoa surda e intérprete
- confirmação de entendimento sem exigir áudio
- glossário de viagem com regionalismos e termos de empresas rodoviárias
- console do operador com prévia simultânea em texto, voz e Libras
- preferência do usuário sincronizada apenas mediante consentimento
- modo de alto contraste e operação completa por teclado e leitor de tela
- alternativa de atendimento humano em mensagens de alto risco

## Escopo do MVP

### Prioridade P0

| História | Critério de aceite resumido |
|---|---|
| Digitar uma frase | Usuário envia, vê progresso, reproduz e corrige a mensagem |
| Falar uma frase | Permissão contextual, transcrição editável e cancelamento |
| Reproduzir em Libras | Play, pausa, reinício e velocidade entre faixas úteis |
| Usar frases de viagem | Catálogo pesquisável por etapa da jornada |
| Entender alterações | Aviso mostra o que mudou, impacto e ação esperada |
| Navegar com tecnologia assistiva | Ordem de foco, nomes acessíveis, contraste e zoom testados |
| Controlar privacidade | Sem retenção padrão; exclusão clara de histórico local |
| Recuperar falha | Erro explica causa provável e oferece texto ou frase offline |

### Prioridade P1

- histórico e favoritos locais optativos
- exportação ou compartilhamento de vídeo curto
- pacote offline de frases pré-validadas
- preferências de aparência e velocidade
- QR associado à viagem
- avaliação simples de entendimento e qualidade

### Prioridade P2

- simplificação assistida de texto
- descrição de imagens relevantes
- painel de métricas agregadas
- console do operador
- atendimento humano remoto
- avatar original customizável

### Fora do MVP

- prometer tradução perfeita de qualquer conteúdo
- certificar conformidade apenas por instalar uma barra
- armazenar áudio e mensagens sem necessidade
- usar reconhecimento emocional ou biometria
- reproduzir avatar, interface ou identidade da Rybená

## Arquitetura recomendada para o MVP

| Camada | Responsabilidade | Escolha inicial sugerida |
|---|---|---|
| Interface | Entrada, player, preferências e estados | Web responsiva ou React Native com design próprio |
| Acessibilidade | Semântica, foco, contraste, escala e leitor de tela | Implementação nativa e testes WCAG 2.2 AA |
| Fala | Converter voz em texto | API do sistema ou serviço com consentimento explícito |
| Orquestração | Normalizar conteúdo e decidir motor | Serviço próprio com contratos claros |
| Libras | Traduzir e renderizar | VLibras ou conteúdo pré-validado, conforme licença |
| Conteúdo crítico | Avisos estáveis e emergência | Biblioteca versionada revisada por especialistas |
| Integração | Dados de bilhete, plataforma e status | API simulada no trabalho acadêmico |
| Telemetria | Erros, latência e uso agregado | Eventos mínimos sem conteúdo das mensagens |

O motor de Libras deve ser encapsulado por uma interface própria. Isso reduz dependência tecnológica e permite comparar VLibras, conteúdo pré-gravado e futuros provedores. Cada mensagem precisa carregar metadados de origem, versão, nível de revisão e validade. Conteúdo crítico revisado sempre prevalece sobre geração automática.

### Contrato funcional sugerido

- **Entrada** texto, idioma, contexto de viagem, nível de risco e preferência de regionalismo
- **Saída** sequência reproduzível, transcrição final, origem do conteúdo, alertas de termo desconhecido e indicador de revisão humana
- **Falha** código legível, alternativa em texto simples e ação de recuperação

## Plano de pesquisa com usuários

### Descoberta

Realizar entrevistas e observação contextual com pessoas surdas que usam Libras como língua principal, viajantes com baixa alfabetização, atendentes e operadores. O objetivo não é validar uma solução já desenhada, mas identificar momentos de falha, vocabulário e estratégias atuais.

### Cocriação

Conduzir oficina com protótipos de baixa fidelidade. Priorizar localização do avatar, tamanho das mãos e rosto, controles de repetição, confirmação de entendimento, regionalismo e diferença entre aviso automático e revisado.

### Teste formativo

Uma rodada com cinco a oito participantes pode revelar problemas graves de usabilidade, mas não sustenta conclusões populacionais. Faça novas rodadas após correções. Inclua diferentes idades, níveis de português e familiaridade tecnológica. Remunere participantes e disponibilize comunicação acessível no recrutamento e consentimento.

### Validação linguística

Pessoas surdas fluentes e profissionais de Libras devem avaliar fidelidade de sentido, gramática, expressões não manuais e clareza. Não usar somente pessoas ouvintes que conhecem Libras como substitutas da comunidade-alvo.

## Métricas e critérios de sucesso

| Dimensão | Métrica | Meta inicial de projeto |
|---|---|---|
| Tarefa | Conclusão sem ajuda | 85% em fluxos P0 após segunda rodada |
| Compreensão | Resposta correta sobre ação esperada | 90% em avisos críticos pré-validados |
| Usabilidade | UMUX Lite ou SUS | Evolução entre rodadas, não apenas nota final |
| Linguística | Avaliação por surdos e especialistas | Nenhum erro crítico em catálogo publicado |
| Desempenho | Latência p95 | Até 3 s online para frases curtas no protótipo |
| Robustez | Sessões sem falha | 99% no ambiente demonstrado |
| Fala | Taxa de erro de palavras | Medida por ruído, sotaque e vocabulário de viagem |
| Cobertura | Taxa de termos desconhecidos | Queda contínua no glossário de domínio |
| Acessibilidade | Critérios aplicáveis | Sem falhas bloqueadoras WCAG 2.2 A e AA |
| Privacidade | Conteúdo sensível em logs | Zero por padrão |

Metas são hipóteses acadêmicas e devem ser ajustadas após um piloto. Para tradução automática, uma nota agregada não basta: qualquer erro capaz de levar o viajante ao local errado deve ser classificado como crítico.

## Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Tradução incorreta | Desinformação e perda de viagem | Catálogo validado, alerta de limite e atendimento humano |
| Avatar pouco legível | Baixa compreensão | Teste com usuários, tamanho adequado e controle de velocidade |
| Dependência de internet | Falha no terminal | Frases offline e texto simples sempre disponível |
| Dependência de fornecedor | Interrupção ou custo | Camada de abstração e conteúdo crítico próprio |
| Privacidade de mensagens | Exposição de localização ou saúde | Não reter conteúdo, minimizar logs e consentimento contextual |
| “Acessibilidade de fachada” | Produto ainda inacessível | Auditoria do fluxo completo e testes assistivos reais |
| Confusão de marca | Risco jurídico e acadêmico | Nome, identidade, avatar e UX próprios |
| Escopo excessivo | Protótipo incompleto | Limitar P0 a uma jornada de viagem demonstrável |
| Métrica enganosa | Falsa sensação de qualidade | Separar precisão linguística, compreensão e conclusão de tarefa |

## Plano de execução acadêmica

### Fase 1 descoberta e especificação

- mapear jornada de viagem e mensagens de maior risco
- entrevistar usuários e especialistas
- fechar catálogo inicial de vinte a quarenta frases
- decidir licença e integração do motor de Libras
- produzir critérios de aceite e modelo de dados

### Fase 2 protótipo funcional

- construir fluxo de texto e voz
- integrar player de Libras ou vídeos validados
- implementar estados de carregamento, falha e offline
- garantir navegação por teclado e leitor de tela
- registrar telemetria sem conteúdo sensível

### Fase 3 validação e refinamento

- testar com usuários surdos e atendentes
- corrigir bloqueadores de compreensão e acessibilidade
- medir latência, erros e termos desconhecidos
- documentar limitações e decisões
- preparar demonstração com cenários realistas

### Entregáveis sugeridos

- mapa de jornada e problema priorizado
- protótipo navegável e código-fonte original
- matriz de requisitos e critérios de aceite
- inventário de mensagens validadas
- relatório de teste com usuários
- nota de arquitetura e privacidade
- registro de licenças, fontes e decisões de propriedade intelectual

## Conclusão

A principal força da Rybená é a composição: tradução em Libras, voz, ajustes visuais, múltiplos canais e implantação corporativa. A ideia de combinar essas capacidades pode inspirar um produto acadêmico, mas o diferencial relevante para a ClickBus não será um avatar genérico. Será a integração com eventos reais da viagem, o tratamento seguro de mensagens críticas e uma experiência construída com pessoas surdas.

O MVP mais defensável usa implementação própria e componentes licenciados, começa por uma jornada pequena e mede compreensão. A tradução automática deve ser apresentada como apoio, não como garantia. Acessibilidade deve estar na estrutura do produto, não restrita a uma barra. Com esse recorte, o trabalho da FIAP pode demonstrar pesquisa, engenharia, design inclusivo e responsabilidade sem replicar indevidamente o produto da Rybená.

## Referências

- Rybená. [Página institucional](https://www.rybena.com.br/). Acesso em 6 set. 2026.
- Rybená. [Soluções](https://www.rybena.com.br/solucoes/). Acesso em 6 set. 2026.
- Rybená. [Sobre a empresa](https://www.rybena.com.br/sobre/). Acesso em 6 set. 2026.
- Rybená. [Planos](https://www.rybena.com.br/planos/). Acesso em 6 set. 2026.
- Rybená. [Documentação de início](https://docs.rybena.com.br/docs/getting-started). Acesso em 6 set. 2026.
- Rybená. [Instalação](https://docs.rybena.com.br/docs/getting-started/installation). Acesso em 6 set. 2026.
- Rybená. [Integrações](https://docs.rybena.com.br/docs/integrations). Acesso em 6 set. 2026.
- Rybená. [API JavaScript](https://docs.rybena.com.br/docs/api). Acesso em 6 set. 2026.
- Rybená. [Privacidade técnica](https://docs.rybena.com.br/docs/getting-started/data-privacy). Acesso em 6 set. 2026.
- Rybená. [Política de privacidade LGPD](https://docs.rybena.com.br/docs/legal/politica-privacidade-lgpd). Acesso em 6 set. 2026.
- Rybená. [Termos do aplicativo](https://rybena.com.br/en/termos-app). Acesso em 6 set. 2026.
- Google Play. [Rybená Tradutor de Libras](https://play.google.com/store/apps/details?id=com.rybena.app). Acesso em 6 set. 2026.
- Apple. [Rybená Tradutor de Libras](https://apps.apple.com/br/app/ryben%C3%A1-tradutor-de-libras/id6748836003). Acesso em 6 set. 2026.
- IBGE. [Pessoas com deficiência no Censo 2022](https://educa.ibge.gov.br/criancas/voce-sabia/23239-deficiencia.html). Acesso em 6 set. 2026.
- IBGE. [Pessoas com deficiência e as desigualdades sociais no Brasil PNAD 2022](https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102013_informativo.pdf). Acesso em 6 set. 2026.
- Brasil. [Lei 13.146 de 2015](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm). Acesso em 6 set. 2026.
- Brasil. [Lei 10.436 de 2002](https://planalto.gov.br/ccivil_03/leis/2002/l10436.htm). Acesso em 6 set. 2026.
- Brasil. [Decreto 5.626 de 2005](https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/decreto/d5626.htm). Acesso em 6 set. 2026.
- W3C. [Web Content Accessibility Guidelines WCAG 2.2](https://www.w3.org/TR/WCAG22/). Acesso em 6 set. 2026.
- ABNT. [NBR 17225 Acessibilidade digital para web](https://www2.camara.leg.br/a-camara/estruturaadm/gestao-na-camara-dos-deputados/responsabilidade-social-e-ambiental/acessibilidade/pdfs/ABNTNBR17225AcessibilidadeDigitalparaWeb.pdf). 2025.
- Câmara dos Deputados. [Normas de acessibilidade da ABNT](https://www2.camara.leg.br/a-camara/estruturaadm/gestao-na-camara-dos-deputados/responsabilidade-social-e-ambiental/acessibilidade/normas-da-abnt-1). Acesso em 6 set. 2026.
- Governo Digital. [VLibras](https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/vlibras/vlibras). Acesso em 6 set. 2026.
- Conecta gov.br. [Catálogo de APIs VLibras](https://www.gov.br/conecta/catalogo/apis/vlibras). Acesso em 6 set. 2026.
- Hand Talk. [Aplicativo](https://www.handtalk.me/br/aplicativo/). Acesso em 6 set. 2026.
- Santos et al. [A usabilidade de avatares de Libras em sites](https://doi.org/10.23972/det2018iss16pp41-51). Design e Tecnologia, 2018.
- Bragg et al. [The State of Sign Language AI](https://arxiv.org/abs/2403.02563). 2024.
- INPI. [Perguntas frequentes sobre programas de computador](https://www.gov.br/inpi/pt-br/acesso-a-informacao/perguntas-frequentes/programas-de-computador). Acesso em 6 set. 2026.
- Brasil. [Lei 9.609 de 1998](https://planalto.gov.br/ccivil_03/leis/l9609.htm). Acesso em 6 set. 2026.
- Brasil. [Lei 9.279 de 1996](https://www.planalto.gov.br/ccivil_03/leis/l9279.htm). Acesso em 6 set. 2026.
- Google Patents. [BRPI0502931A](https://patents.google.com/patent/BRPI0502931A/pt). Acesso em 6 set. 2026.

## Nota final de uso

Este relatório é material de pesquisa e planejamento acadêmico. Ele não substitui auditoria de acessibilidade, avaliação linguística, teste de segurança, análise de licenças ou parecer jurídico. Funcionalidades, preços, políticas e disponibilidade refletem o estado público consultado em 6 de setembro de 2026.
