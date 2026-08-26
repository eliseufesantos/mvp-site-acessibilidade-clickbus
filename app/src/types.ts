export type JourneyStep = 'search' | 'results' | 'seats' | 'checkout' | 'confirmation';

export interface SearchValues {
  origin: string;
  destination: string;
  date: string;
}

export interface Trip {
  id: string;
  company: string;
  serviceClass: string;
  departure: string;
  arrival: string;
  duration: string;
  availableSeats: number;
  price: number;
  badge?: string;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  elderlyMode: boolean;
  librasWidget: boolean;
  reducedMotion: boolean;
}
