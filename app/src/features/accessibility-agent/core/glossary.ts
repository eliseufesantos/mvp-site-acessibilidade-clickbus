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
  return GLOSSARY.find((entry) => {
    const known = normalize(entry.term);
    return known === query || (query.length >= 4 && (known.includes(query) || query.includes(known)));
  }) ?? null;
};
