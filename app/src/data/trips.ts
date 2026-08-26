import type { Trip } from '../types';

export const trips: Trip[] = [
  {
    id: 'expresso-2230',
    company: 'Expresso do Sul',
    serviceClass: 'Leito-cama',
    departure: '22:30',
    arrival: '04:45',
    duration: '6h 15min',
    availableSeats: 12,
    price: 129.9,
    badge: 'Melhor custo-benefício',
  },
  {
    id: 'aguia-2300',
    company: 'Águia Branca',
    serviceClass: 'Executivo',
    departure: '23:00',
    arrival: '05:40',
    duration: '6h 40min',
    availableSeats: 8,
    price: 139.9,
  },
  {
    id: 'util-2330',
    company: 'UTIL',
    serviceClass: 'Semi-leito',
    departure: '23:30',
    arrival: '06:00',
    duration: '6h 30min',
    availableSeats: 5,
    price: 149.9,
  },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

