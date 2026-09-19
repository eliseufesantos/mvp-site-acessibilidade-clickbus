import { useEffect, useRef, useState } from 'react';
import { AccessibilityPlugin } from '../components/accessibility/AccessibilityPlugin';
import { ReadingAids } from '../components/accessibility/ReadingGuide';
import { Header } from '../components/layout/Header';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { ConfirmationPage } from '../features/confirmation/ConfirmationPage';
import { ResultsPage } from '../features/results/ResultsPage';
import { SearchPage } from '../features/search/SearchPage';
import { SeatSelectionPage } from '../features/seats/SeatSelectionPage';
import { useAccessibilityPreferences } from '../hooks/useAccessibilityPreferences';
import type { JourneyStep, SearchValues, Trip } from '../types';
import { getDefaultTravelDate } from '../utils/date';
import { focusAfterRender } from '../utils/focus';

const initialSearch: SearchValues = {
  origin: 'São Paulo (SP)',
  destination: 'Rio de Janeiro (RJ)',
  date: getDefaultTravelDate(),
};

const titles: Record<JourneyStep, string> = {
  search: 'Buscar passagem',
  results: 'Escolher viagem',
  seats: 'Escolher assento',
  checkout: 'Dados do passageiro',
  confirmation: 'Simulação concluída',
};

export function App() {
  const [step, setStep] = useState<JourneyStep>('search');
  const [search, setSearch] = useState(initialSearch);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [seat, setSeat] = useState<number | null>(null);
  const [pageEpoch, setPageEpoch] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const {
    preferences,
    stateRevision,
    storageAvailable,
    applyPreferences,
    resetPreferences,
    undoPreferences,
    canUndo,
    getPreferences,
    getStateRevision,
  } = useAccessibilityPreferences();

  useEffect(() => {
    document.title = `${titles[step]} | ClickBus Acessível`;
    setPageEpoch((current) => current + 1);
    window.scrollTo({ top: 0, behavior: 'auto' });
    focusAfterRender(() => mainRef.current, { preventScroll: true });
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
          onChangeDate={(date) => setSearch((current) => ({ ...current, date }))}
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
      <Header onHome={restart} />
      <AccessibilityPlugin
        canUndo={canUndo}
        getPreferences={getPreferences}
        getStateRevision={getStateRevision}
        preferences={preferences}
        stateRevision={stateRevision}
        storageAvailable={storageAvailable}
        page={step}
        pageEpoch={pageEpoch}
        onApplyPreferences={applyPreferences}
        onResetPreferences={resetPreferences}
        onUndoPreferences={undoPreferences}
      />
      <main id="main-content" tabIndex={-1} ref={mainRef} data-page={step}>
        {content}
      </main>
      <footer className="site-footer">
        <div className="container">
          <strong>ClickBus Acessível</strong>
          <span>Protótipo acadêmico — não realiza compras</span>
        </div>
      </footer>
      {preferences.readingGuide || preferences.readingMask ? <ReadingAids guide={preferences.readingGuide} mask={preferences.readingMask} /> : null}
    </div>
  );
}
