export interface GlossaryEntry {
  term: string;
  explanation: string;
}

export const GLOSSARY: readonly GlossaryEntry[] = [
  { term: 'Viação', explanation: 'É a empresa responsável por operar a viagem de ônibus.' },
  { term: 'Terminal', explanation: 'É o local de embarque ou desembarque. Também pode ser chamado de rodoviária.' },
  { term: 'Embarque', explanation: 'É o momento e o local em que você entra no ônibus.' },
  { term: 'Desembarque', explanation: 'É o momento e o local em que você sai do ônibus.' },
  { term: 'Itinerário', explanation: 'É a descrição do caminho da viagem, incluindo pontos e horários informados.' },
  { term: 'Direto', explanation: 'Indica que a opção apresentada não mostra troca de ônibus durante o trajeto.' },
  { term: 'Conexão', explanation: 'É uma troca de ônibus ou de trecho durante a viagem. Confira os detalhes da opção.' },
  { term: 'Duração', explanation: 'É o tempo estimado entre a saída e a chegada.' },
  { term: 'Classe de serviço', explanation: 'É a categoria informada para a viagem. Confira as comodidades listadas para saber o que aquela opção oferece.' },
];

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR')
  .trim();

export const explainFromGlossary = (term: string): GlossaryEntry | null => {
  const query = normalize(term);
  if (!query) return null;

  // Correspondencia exata primeiro. A busca aproximada sozinha percorria o
  // glossario na ordem de declaracao e parava no primeiro verbete cuja palavra
  // fosse substring da pergunta: "desembarque" casava com "Embarque", que vem
  // antes na lista, e a pessoa recebia a definicao do termo oposto.
  const exact = GLOSSARY.find((entry) => normalize(entry.term) === query);
  if (exact) return exact;

  // Entre varios verbetes aproximados, o mais longo e o mais especifico:
  // "desembarque" ganha de "embarque" em vez de depender da ordem da lista.
  return [...GLOSSARY]
    .filter((entry) => {
      const known = normalize(entry.term);
      return query.length >= 4 && (known.includes(query) || query.includes(known));
    })
    .sort((a, b) => normalize(b.term).length - normalize(a.term).length)[0] ?? null;
};

/**
 * Formas de perguntar "o que é X" em português. O grupo capturado é o termo.
 *
 * A lista é deliberadamente curta e ancorada no início da frase: ela existe
 * para reconhecer uma pergunta de dicionário evidente, não para interpretar
 * pedidos em geral. Qualquer coisa fora daqui segue para o planejador.
 */
const GLOSSARY_QUESTION_PATTERNS: readonly RegExp[] = [
  /^o que (?:e|sao|significa|significam|quer dizer)\s+(.+)$/,
  /^que significa\s+(.+)$/,
  /^significado d[eo]\s+(.+)$/,
  /^(?:explique|explica|explicar)\s+(?:me\s+)?(?:o (?:que e o?a?\s*)?termo\s+|a palavra\s+)?(.+)$/,
  /^(?:nao entendi|nao sei)\s+(?:o que e\s+|o termo\s+|a palavra\s+)?(.+)$/,
];

// Um termo de dicionário é curto. O teto evita que uma frase longa que por
// acaso contenha uma palavra conhecida seja sequestrada por este caminho:
// nesses casos o planejador decide, como antes.
const MAX_LOCAL_TERM_LENGTH = 40;

/**
 * Reconhece uma pergunta de dicionário que o glossário local já responde.
 *
 * Existe para que uma resposta determinística, offline e instantânea não fique
 * refém da cota do provedor de IA: antes, o roteamento da intenção passava
 * obrigatoriamente por `/api/accessibility/plan`, então "o que é viação" — que
 * está no glossário — falhava junto com o provedor.
 *
 * Devolve `null` para tudo que não seja uma correspondência clara, e nesse caso
 * o fluxo normal do planejador continua valendo.
 */
export const matchGlossaryQuestion = (message: string): GlossaryEntry | null => {
  const asked = normalize(message).replace(/[?!.]+$/, '').trim();
  if (!asked) return null;
  for (const pattern of GLOSSARY_QUESTION_PATTERNS) {
    const term = pattern.exec(asked)?.[1]
      ?.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
      .trim();
    if (term && term.length <= MAX_LOCAL_TERM_LENGTH) {
      const known = explainFromGlossary(term);
      if (known) return known;
    }
  }
  return null;
};
