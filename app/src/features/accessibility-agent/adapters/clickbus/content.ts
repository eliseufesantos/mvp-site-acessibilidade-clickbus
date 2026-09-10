import type { JourneyStep } from '../../../../types';

export interface PublicContentTarget {
  id: string;
  label: string;
  text: string;
  allowSimplify: boolean;
}

const CONTENT_BY_PAGE: Record<JourneyStep, readonly PublicContentTarget[]> = {
  search: [{
    id: 'search-help',
    label: 'Ajuda da busca',
    text: 'Escolha a cidade de saída, o destino e a data. Se houver mais de um terminal, confira o local antes de buscar.',
    allowSimplify: true,
  }],
  results: [
    {
      id: 'results-help',
      label: 'Como comparar viagens',
      text: 'Compare os horários e o local de embarque. Use os filtros para reduzir a lista e a ordenação para mudar a sequência das viagens.',
      allowSimplify: true,
    },
    {
      id: 'service-class-help',
      label: 'Classe de serviço',
      text: 'A classe descreve o tipo de serviço da viagem. Consulte as comodidades informadas para essa opção.',
      allowSimplify: true,
    },
  ],
  seats: [{
    id: 'seat-map-help',
    label: 'Ajuda do mapa de assentos',
    text: 'Os lugares disponíveis mostram um número. Escolha um deles. Os lugares ocupados não podem ser selecionados. Você pode navegar com Tab ou pelas setas.',
    allowSimplify: true,
  }],
  checkout: [],
  confirmation: [],
};

export const getPublicContentTargets = (page: JourneyStep): readonly PublicContentTarget[] => CONTENT_BY_PAGE[page];

export const resolvePublicContent = (page: JourneyStep, id: string): PublicContentTarget | null =>
  CONTENT_BY_PAGE[page].find((target) => target.id === id) ?? null;

export const getApprovedPageSelection = (
  page: JourneyStep,
): { term: string; contentRef: string } | null => {
  const selection = window.getSelection();
  const term = selection?.toString().replace(/\s+/g, ' ').trim() ?? '';
  if (!selection || selection.rangeCount === 0 || term.length < 2 || term.length > 120) return null;
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element = container.nodeType === Node.ELEMENT_NODE
    ? container as Element
    : container.parentElement;
  const approved = element?.closest<HTMLElement>('[data-a11y-content-id]');
  if (!approved) return null;
  const contentRef = approved.dataset.a11yContentId ?? '';
  return resolvePublicContent(page, contentRef) ? { term, contentRef } : null;
};
