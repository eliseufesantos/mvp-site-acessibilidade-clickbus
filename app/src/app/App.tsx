import { useEffect, useRef, useState } from 'react';
import { VLibrasWidget } from '../components/accessibility/VLibrasWidget';
import { Header } from '../components/layout/Header';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { ConfirmationPage } from '../features/confirmation/ConfirmationPage';
import { ResultsPage } from '../features/results/ResultsPage';
import { SearchPage } from '../features/search/SearchPage';
import { SeatSelectionPage } from '../features/seats/SeatSelectionPage';
import { useAccessibilityPreferences } from '../hooks/useAccessibilityPreferences';
import type { JourneyStep, SearchValues, Trip } from '../types';

const initialSearch: SearchValues = {
  origin: 'São Paulo (SP)',
  destination: 'Rio de Janeiro (RJ)',
  date: '2026-08-30',
};

const titles: Record<JourneyStep, string> = {
  search: 'Buscar passagem',
  results: 'Escolher viagem',
  seats: 'Escolher assento',
  checkout: 'Dados do passageiro',
  confirmation: 'Compra confirmada',
};

export function App() {
  const [step, setStep] = useState<JourneyStep>('search');
  const [search, setSearch] = useState(initialSearch);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [seat, setSeat] = useState<number | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const { preferences, resetPreferences, togglePreference } = useAccessibilityPreferences();

  useEffect(() => {
    document.title = `${titles[step]} | ClickBus Acessível`;
    window.scrollTo({ top: 0, behavior: 'auto' });
    window.requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
  }, [step]);

  const restart = () => {
    setStep('search');
    setTrip(null);
    setSeat(null);
  };

  const selectTrip = (selectedTrip: Trip) => {
    setTrip(selectedTrip);
    setSeat(null);
    setStep('seats');
  };

  let content: React.ReactNode;
  if (step === 'search') {
    content = (
      <SearchPage
        initialValues={search}
        onSearch={(values) => {
          setSearch(values);
          setStep('results');
        }}
      />
    );
  } else if (step === 'results') {
    content = (
      <ResultsPage
        search={search}
        preferences={preferences}
        onBack={() => setStep('search')}
        onSelectTrip={selectTrip}
      />
    );
  } else if (step === 'seats' && trip) {
    content = (
      <SeatSelectionPage
        trip={trip}
        search={search}
        selectedSeat={seat}
        preferences={preferences}
        onBack={() => setStep('results')}
        onSelectSeat={setSeat}
        onContinue={() => setStep('checkout')}
      />
    );
  } else if (step === 'checkout' && trip && seat) {
    content = (
      <CheckoutPage
        trip={trip}
        seat={seat}
        search={search}
        preferences={preferences}
        onBack={() => setStep('seats')}
        onComplete={() => setStep('confirmation')}
      />
    );
  } else if (step === 'confirmation' && trip && seat) {
    content = <ConfirmationPage trip={trip} seat={seat} search={search} onRestart={restart} />;
  } else {
    content = <SearchPage initialValues={search} onSearch={(values) => { setSearch(values); setStep('results'); }} />;
  }

  return (
    <div className="app" id="inicio">
      <a className="skip-link" href="#main-content">Pular para o conteúdo principal</a>
      <Header
        preferences={preferences}
        onHome={restart}
        onResetPreferences={resetPreferences}
        onTogglePreference={togglePreference}
      />
      <main id="main-content" tabIndex={-1} ref={mainRef}>
        {content}
      </main>
      <footer className="site-footer">
        <div className="container">
          <strong>ClickBus Acessível</strong>
          <span>Protótipo de demonstração</span>
        </div>
      </footer>
      <VLibrasWidget enabled={preferences.librasWidget} />
    </div>
  );
}
