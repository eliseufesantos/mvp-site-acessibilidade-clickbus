import type { SeatDefinition, Trip } from '../types';

export const locations = [
  'São Paulo (SP)',
  'Rio de Janeiro (RJ)',
  'Belo Horizonte (MG)',
  'Campinas (SP)',
] as const;

const makeSeats = (occupied: number[]): SeatDefinition[] => {
  const occupiedSet = new Set(occupied);
  return Array.from({ length: 24 }, (_, index) => ({
    number: index + 1,
    occupied: occupiedSet.has(index + 1),
  }));
};

const sharedRoute = {
  origin: 'São Paulo (SP)',
  destination: 'Rio de Janeiro (RJ)',
  originTerminal: 'Terminal Rodoviário Tietê',
  originAddress: 'Av. Cruzeiro do Sul, 1800 — Santana, São Paulo',
  destinationTerminal: 'Rodoviária do Rio',
  destinationAddress: 'Av. Francisco Bicalho, 1 — Santo Cristo, Rio de Janeiro',
};

export const trips: Trip[] = [
  {
    ...sharedRoute,
    id: 'expresso-0700',
    company: 'Expresso do Sul',
    serviceClass: 'Executivo',
    departure: '07:00',
    arrival: '13:35',
    arrivesNextDay: false,
    duration: '6h 35min',
    amenities: ['Ar-condicionado', 'Wi-Fi', 'Passagem digital'],
    seats: makeSeats([2, 5, 6, 13, 18, 21]),
    price: 119.9,
    badge: 'Menor preço',
  },
  {
    ...sharedRoute,
    id: 'util-0930',
    company: 'UTIL',
    serviceClass: 'Semi-leito',
    departure: '09:30',
    arrival: '16:00',
    arrivesNextDay: false,
    duration: '6h 30min',
    amenities: ['Ar-condicionado', 'Tomada USB', 'Passagem digital'],
    seats: makeSeats([1, 3, 8, 10, 11, 16, 20, 23]),
    price: 134.9,
  },
  {
    ...sharedRoute,
    id: 'aguia-1230',
    company: 'Águia Branca',
    serviceClass: 'Leito',
    departure: '12:30',
    arrival: '19:10',
    arrivesNextDay: false,
    duration: '6h 40min',
    amenities: ['Ar-condicionado', 'Wi-Fi', 'Água', 'Passagem digital'],
    seats: makeSeats([4, 7, 9, 12, 17, 22]),
    price: 159.9,
    badge: 'Mais confortável',
  },
  {
    ...sharedRoute,
    id: 'expresso-1830',
    company: 'Expresso do Sul',
    serviceClass: 'Semi-leito',
    departure: '18:30',
    arrival: '01:00',
    arrivesNextDay: true,
    duration: '6h 30min',
    amenities: ['Ar-condicionado', 'Tomada USB', 'Passagem digital'],
    seats: makeSeats([2, 4, 5, 14, 15, 19, 24]),
    price: 129.9,
  },
  {
    ...sharedRoute,
    id: 'util-2200',
    company: 'UTIL',
    serviceClass: 'Leito-cama',
    departure: '22:00',
    arrival: '04:20',
    arrivesNextDay: true,
    duration: '6h 20min',
    amenities: ['Ar-condicionado', 'Wi-Fi', 'Cobertor', 'Passagem digital'],
    seats: makeSeats([1, 6, 8, 9, 10, 13, 16, 18, 21]),
    price: 189.9,
  },
  {
    ...sharedRoute,
    id: 'aguia-2330',
    company: 'Águia Branca',
    serviceClass: 'Executivo',
    departure: '23:30',
    arrival: '06:15',
    arrivesNextDay: true,
    duration: '6h 45min',
    amenities: ['Ar-condicionado', 'Tomada USB', 'Passagem digital'],
    seats: makeSeats([3, 7, 12, 20]),
    price: 124.9,
  },
];

export const isKnownLocation = (value: string) => locations.includes(value as (typeof locations)[number]);

export const getTripsForRoute = (origin: string, destination: string) =>
  trips.filter((trip) => trip.origin === origin && trip.destination === destination);

export const getAvailableSeatCount = (trip: Trip) => trip.seats.filter((seat) => !seat.occupied).length;

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
