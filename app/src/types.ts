export type JourneyStep = 'search' | 'results' | 'seats' | 'checkout' | 'confirmation';

export interface SearchValues {
  origin: string;
  destination: string;
  date: string;
}

export type ServiceClass = 'Executivo' | 'Semi-leito' | 'Leito' | 'Leito-cama';

export interface SeatDefinition {
  number: number;
  occupied: boolean;
}

export interface Trip {
  id: string;
  company: string;
  serviceClass: ServiceClass;
  origin: string;
  destination: string;
  originTerminal: string;
  originAddress: string;
  destinationTerminal: string;
  destinationAddress: string;
  departure: string;
  arrival: string;
  arrivesNextDay: boolean;
  duration: string;
  amenities: string[];
  seats: SeatDefinition[];
  price: number;
  badge?: string;
}

export interface AccessibilityPreferences {
  contrast: 'default' | 'high';
  textScale: 1 | 1.125 | 1.25 | 1.5;
  controlSize: 'default' | 'large';
  cursor: 'default' | 'large';
  highlightLinks: boolean;
  highlightHeadings: boolean;
  letterSpacing: 'default' | 'wide';
  lineHeight: 'default' | 'comfortable' | 'wide';
  textAlign: 'original' | 'left' | 'center';
  readingGuide: boolean;
  readingMask: boolean;
  reducedMotion: boolean;
  saturation: 'default' | 'high' | 'low' | 'grayscale';
  colorFilter: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  dyslexiaFont: boolean;
  librasSpeed: 0.5 | 0.75 | 1 | 1.25 | 1.5;
}
