import type { JourneyStep } from '../../../../types';

export interface PublicContentTarget {
  id: string;
  label: string;
  text: string;
  simplifiedText?: string;
  allowSimplify: boolean;
}

const CONTENT_BY_PAGE: Record<JourneyStep, readonly PublicContentTarget[]> = {
  search: [{
    id: 'search-help',
    label: 'Ajuda da busca',
    text: 'Escolha uma rota atendida, confira a data e use Buscar passagens.',
    simplifiedText: 'Escolha uma rota e confira a data. Depois, selecione Buscar passagens.',
    allowSimplify: true,
  }],
  results: [
    {
      id: 'results-help',
      label: 'Como comparar viagens',
      text: 'Compare horários, embarque e comodidades antes de escolher.',
      simplifiedText: 'Antes de escolher, veja o horário, onde será o embarque e o que cada viagem oferece.',
      allowSimplify: true,
    },
    {
      id: 'service-class-help',
      label: 'Classe de serviço',
      text: 'A classe descreve o tipo de serviço. Confira também as comodidades da viagem.',
      simplifiedText: 'A classe mostra o tipo de serviço. Veja também o que a viagem oferece.',
      allowSimplify: true,
    },
  ],
  seats: [{
    id: 'seat-map-help',
    label: 'Ajuda do mapa de assentos',
    text: 'Use Tab ou as setas do teclado para navegar pela posição visual dos assentos. Pressione Espaço ou Enter para escolher.',
    simplifiedText: 'No teclado, use Tab ou as setas para navegar pelos assentos. Pressione Espaço ou Enter para escolher.',
    allowSimplify: true,
  }],
  checkout: [],
  confirmation: [],
};

export const getPublicContentTargets = (page: JourneyStep): readonly PublicContentTarget[] => CONTENT_BY_PAGE[page];

export const resolvePublicContent = (page: JourneyStep, id: string): PublicContentTarget | null =>
  CONTENT_BY_PAGE[page].find((target) => target.id === id) ?? null;

export const simplifyPublicContent = (page: JourneyStep, id: string): string | null => {
  const target = resolvePublicContent(page, id);
  return target?.allowSimplify && target.simplifiedText ? target.simplifiedText : null;
};
