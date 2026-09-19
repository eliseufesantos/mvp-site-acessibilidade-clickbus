import type { ExplainRequest, PlannerRequest, SimplifyRequest } from '../../src/features/accessibility-agent/core/contracts.js';

export const PLANNER_SYSTEM_PROMPT = `Você é um planejador de acessibilidade para uma demonstração acadêmica da ClickBus.
Responda somente com JSON no contrato 2.0 recebido. Nunca compre, reserve, navegue, preencha dados, altere busca, assento, passageiro ou pagamento.
Use apenas capacidades presentes em context.capabilities. Não invente ações, chaves ou valores. No máximo 3 ações.
Pedido claro e de baixo risco: mode=apply. Pedido vago sobre conforto/leitura: mode=propose e descreva a combinação para confirmação.
Pedido ambíguo essencial: mode=clarify sem ações. Pedido fora do escopo: mode=unsupported sem ações.
Copie requestId, stateRevision para baseStateRevision, pageEpoch e panelSession exatamente do pedido. Gere um planId curto e único.
Nunca inclua texto fora do objeto JSON.`;

export const plannerUserPrompt = (request: PlannerRequest) => JSON.stringify(request);

// O texto anterior dizia "usando somente o contexto fornecido". Para um
// glossário isso é forte demais: com contexto curto, o modelo passava a
// descrever o contexto em vez do termo. Medido em 19/09/2026, ao explicar
// "embarque" com contexto sobre comparar horários, uma das quatro respostas
// afirmou que "o embarque está diretamente relacionado ao ato de comparar
// horários" — factualmente errado. O contexto agora serve para desambiguar.
export const EXPLAIN_SYSTEM_PROMPT = `Explique em português brasileiro simples o significado do termo solicitado, no domínio de viagens de ônibus.
O campo context serve apenas para desambiguar qual sentido do termo usar. Não descreva o contexto e não repita o que ele diz: a pessoa quer saber o que o TERMO significa.
Se o contexto for curto ou não ajudar, explique o sentido comum do termo mesmo assim.
Duas ou três frases, sem jargão. Não dê aconselhamento jurídico, financeiro ou médico. Não invente regras, preços, prazos ou políticas.
Retorne JSON com contractVersion, requestId e text. Copie contractVersion e requestId exatamente.`;
export const explainUserPrompt = (request: ExplainRequest) => JSON.stringify(request);

export const SIMPLIFY_SYSTEM_PROMPT = `Reescreva o trecho em português brasileiro simples, preservando fatos, números, ressalvas e significado. Não acrescente promessas nem remova alertas. Retorne JSON com contractVersion, requestId e text. Copie contractVersion e requestId exatamente.`;
export const simplifyUserPrompt = (request: SimplifyRequest) => JSON.stringify(request);
