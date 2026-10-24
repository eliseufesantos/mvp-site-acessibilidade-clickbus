# Validação

O que foi verificado, como, e o que continua pendente. Este é o único lugar do `docs/` que registra estado; os outros documentos descrevem comportamento.

## Regra de evidência

Cada verificação é marcada separadamente como `PASS`, `FAIL`, `NOT RUN` ou `BLOCKED`.

- `PASS` descreve só o que foi de fato observado.
- Teste automatizado, navegador, integração real e avaliação humana não se substituem.
- Um double prova contrato e tratamento de falha, nunca inferência real nem tradução real.
- Passar no axe não é conformidade com a WCAG: ele cobre só parte dos critérios.

## Estado atual

| Área | Estado | Evidência |
| --- | --- | --- |
| Typecheck, build e Vitest (133 testes em 7 arquivos) | `PASS` | local, 24/10/2026 |
| Playwright: axe WCAG 2.1 AA, reflow em 320 px, breakpoint 820/821, header fixo | `PASS` | local, 24/10/2026: 64 aprovados e 6 pulados |
| Regressão manual com axe 4.10.2 em 1440, 821, 820, 390 e 320 px | `PASS` | 19/09/2026: 0 violações, 0 px de overflow (inclusive 320 px com texto a 150% e alto contraste), jornada sem erro de console |
| Smoke das rotas em produção | `PASS` | 19/09/2026: `405`, `403`, `415` e `413` como esperado; nenhuma resposta com `X-Vercel-Error` |
| Conectividade real do Gemini | `PASS` | 19/09/2026, domínio autorizado: respostas 200 dentro do contrato |
| Qualidade semântica da IA | **`PARCIAL`** | ver abaixo |
| Endpoint da Rybená em produção | `PASS` | 19/09/2026: `GET /api/accessibility/rybena` devolve `200` com a URL do CDN |
| Player real da Rybená | observado, sem registro | aberto no navegador em 19/09/2026; evidência formal não registrada |
| Tradução, narração e controles reais da Rybená | `NOT RUN` | só o adaptador de desenvolvimento foi percorrido, e ele não prova nada sobre a Rybená |
| Homologação linguística com pessoas surdas sinalizantes | `NOT RUN` | — |
| Leitores de tela (NVDA, VoiceOver) | `NOT RUN` | — |
| Safari/iOS real e zoom de 200% | `NOT RUN` | — |
| Teste com pessoas usuárias | `NOT RUN` | — |

### Gemini: disponibilidade por modelo

Medido em 19/09/2026, no mesmo endpoint:

| Modelo | Resultado |
| --- | --- |
| `gemini-3.8-flash` | 2 sucessos em 10 (3 × HTTP 503, 5 × HTTP 429) |
| `gemini-3.5-flash` | 4 em 4 — **modelo em uso** |
| `gemini-2.5-flash` | 0 em 6, sempre HTTP 404: aparece em `models.list`, mas não atende `generateContent` |

### Gemini: qualidade semântica

Em quatro explicações do mesmo termo, duas ficaram corretas, uma ficou vaga e uma ficou factualmente errada, porque ancorou no contexto em vez de explicar o termo. A sonda usou contexto propositalmente pobre, então o resultado não é conclusivo. Mas basta para **proibir qualquer alegação de que a explicação por IA é confiável**.

Antes de usar na apresentação, avalie com entradas realistas e revisão humana:

- **casos:** ajustes nos limites, combinações e refinamentos, pedido vago e preset, desfazer e restaurar, Libras indisponível, pedidos comerciais ou de código, capacidade inexistente e prompt injection na mensagem, no histórico e no conteúdo;
- **método:** três rodadas por caso, com paráfrases que não estão no prompt;
- **meta:** pelo menos 90% de acerto semântico, e 100% em escopo e segurança.

Registre modelo, parâmetros, tokens, latência e custo, sem segredo nem conteúdo pessoal.

## Matriz funcional

A coluna **Cobertura** diz se há teste automatizado. "Parcial" significa que só parte do esperado é verificada pela suíte; o restante depende de verificação manual.

| Caso | Verificação | Esperado | Cobertura |
| --- | --- | --- | --- |
| T01 | Abrir e fechar o painel por teclado | foco inicial correto, Escape e retorno ao acionador | automática |
| T02 | Cada preferência, isolada e combinada | efeito real; reflow, foco e controles íntegros | parcial: reflow com texto a 150% e alto contraste; o efeito visual de cada ajuste não é medido |
| T03 | Guia e máscara com mouse e teclado | não interceptam clique nem escondem o foco | manual |
| T04 | Preset, desfazer e no-op | patch explícito; desfazer restaura uma vez; no-op não perde o snapshot | parcial: só o preset |
| T05 | Migração v1, v2 e v3; armazenamento inválido ou bloqueado | v4 válido ou padrão; operação em memória | automática |
| T06 | Pedido direto, vago e relativo | aplica, propõe sem alterar, ou usa o estado atual preservando o resto | parcial: exibição da proposta |
| T07 | Ação ou campo desconhecido; plano de contrato anterior | lote rejeitado antes de qualquer efeito | automática |
| T08 | Pedido comercial, de código ou com prompt injection | nenhuma ferramenta proibida, nenhuma mutação da jornada | parcial: saída fora do contrato; comportamento do modelo real exige avaliação |
| T09 | Resposta tardia; mesmo `planId` duas vezes | descartada; efeito único | automática |
| T10 | IA desligada, timeout, 429 ou 503 | erro finito, atalho para Recursos, controles manuais disponíveis | automática |
| T11 | Termo do glossário pelo chat | resposta local, sem rede | automática |
| T12 | Simplificar alvo público; alvo fora da lista | versão local separada do original; recusa | automática |
| T13 | Ditado suportado, não suportado e fechado durante a captura | transcrição editável; mensagem estável; `abort()` | automática |
| T14 | Rybená sem configuração ou com origem recusada | `503` ou falha finita; crédito e núcleo preservados | automática, com runtime falso |
| T15 | Adaptador Gemini com transporte falso; proteções do handler | payload nativo; um retry só em 503/429; origem, JSON, 16 KiB e quota | automática |
| T16 | Jornada completa com preferências ativas | busca, viagem, assento e passageiro preservados | manual |
| T17 | Chaves no Git, bundle, logs e evidências | nenhuma ocorrência; URL tokenizada não registrada | manual |
| T18 | Rybená real no domínio autorizado | tradução, narração, pausa, retomada, parada e velocidade refletem o estado real | manual, `NOT RUN` |

## Pendências

- Registrar a evidência formal do player real da Rybená e exercitar Libras e voz reais no domínio autorizado.
- Homologar a tradução com pessoas surdas sinalizantes.
- Avaliar a qualidade semântica da IA com entradas realistas e revisão humana.
- Confirmar o modelo da apresentação (hoje `gemini-3.5-flash`), evitando aliases mutáveis.
- Configurar quota/budget do Gemini e rate limit persistente ou WAF antes de exposição pública.
- Validar com NVDA e VoiceOver, em Safari/iOS real e com zoom de 200%.
- Decidir qual dos dois projetos Vercel é o canônico.

## Modelo de registro

```text
Data / ambiente / versão:
Caso:
Entrada e pré-condição:
Esperado:
Observado:
PASS / FAIL / NOT RUN / BLOCKED:
Integração real, estrutura ou double:
Evidência (sanitizada):
Limitação e próxima ação:
```
