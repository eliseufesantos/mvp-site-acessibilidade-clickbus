import { ArrowLeft, ArrowRight, BusFront, Clock3, MapPin, SlidersHorizontal, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ActiveModeBanner } from '../../components/accessibility/ActiveModeBanner';
import { Button } from '../../components/ui/Button';
import { StepProgress } from '../../components/ui/StepProgress';
import { formatCurrency, trips } from '../../data/trips';
import type { AccessibilityPreferences, SearchValues, Trip } from '../../types';

interface ResultsPageProps {
  onBack: () => void;
  onSelectTrip: (trip: Trip) => void;
  preferences: AccessibilityPreferences;
  search: SearchValues;
}

export function ResultsPage({ onBack, onSelectTrip, preferences, search }: ResultsPageProps) {
  const [maxPrice, setMaxPrice] = useState(false);
  const [leitoOnly, setLeitoOnly] = useState(false);

  const visibleTrips = useMemo(
    () =>
      trips.filter((trip) => {
        if (maxPrice && trip.price > 140) return false;
        if (leitoOnly && !trip.serviceClass.toLocaleLowerCase('pt-BR').includes('leito')) return false;
        return true;
      }),
    [leitoOnly, maxPrice],
  );

  return (
    <div className="page-shell">
      <div className="container">
        <StepProgress activeStep={1} />
        <ActiveModeBanner preferences={preferences} />

        <button className="back-link" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" size={19} /> Alterar busca
        </button>

        <section className="route-summary" aria-label="Busca atual">
          <div>
            <span className="route-summary__label">Origem</span>
            <strong>{search.origin}</strong>
          </div>
          <ArrowRight aria-hidden="true" />
          <div>
            <span className="route-summary__label">Destino</span>
            <strong>{search.destination}</strong>
          </div>
          <div className="route-summary__date">
            <span className="route-summary__label">Data</span>
            <strong>30 de agosto</strong>
          </div>
        </section>

        <div className="results-heading">
          <div>
            <span className="eyebrow">Passo 1 de 3</span>
            <h1>Escolha sua viagem</h1>
            <p>{visibleTrips.length} opções fictícias encontradas para esta simulação.</p>
          </div>
          <span className="results-heading__assurance">
            <UsersRound aria-hidden="true" /> Botões e informações essenciais priorizados
          </span>
        </div>

        <div className="results-layout">
          <aside className="filter-card" aria-labelledby="filters-title">
            <div className="filter-card__title">
              <SlidersHorizontal aria-hidden="true" size={21} />
              <h2 id="filters-title">Filtros rápidos</h2>
            </div>
            <label className="check-row">
              <input type="checkbox" checked={maxPrice} onChange={(event) => setMaxPrice(event.target.checked)} />
              <span>Até R$ 140</span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={leitoOnly} onChange={(event) => setLeitoOnly(event.target.checked)} />
              <span>Somente leito</span>
            </label>
            <p>Os filtros atualizam a lista imediatamente.</p>
          </aside>

          <section className="trip-list" aria-label="Viagens disponíveis" aria-live="polite">
            {visibleTrips.map((trip) => (
              <article className="trip-card" key={trip.id}>
                <div className="trip-card__company">
                  <span className="trip-card__company-icon" aria-hidden="true">
                    <BusFront size={22} />
                  </span>
                  <div>
                    <strong>{trip.company}</strong>
                    <span>{trip.serviceClass}</span>
                  </div>
                  {trip.badge ? <span className="status-badge">{trip.badge}</span> : null}
                </div>

                <div className="trip-card__schedule" aria-label={`Saída ${trip.departure}, chegada ${trip.arrival}`}>
                  <div>
                    <strong>{trip.departure}</strong>
                    <span><MapPin aria-hidden="true" size={16} /> São Paulo</span>
                  </div>
                  <div className="trip-card__duration">
                    <span><Clock3 aria-hidden="true" size={16} /> {trip.duration}</span>
                    <i aria-hidden="true" />
                    <span>Direto</span>
                  </div>
                  <div>
                    <strong>{trip.arrival}</strong>
                    <span><MapPin aria-hidden="true" size={16} /> Rio de Janeiro</span>
                  </div>
                </div>

                <div className="trip-card__action">
                  <span>{trip.availableSeats} assentos livres</span>
                  <strong>{formatCurrency(trip.price)}</strong>
                  <small>por pessoa</small>
                  <Button variant="primary" onClick={() => onSelectTrip(trip)}>
                    Escolher <ArrowRight aria-hidden="true" size={19} />
                  </Button>
                </div>
              </article>
            ))}
            {visibleTrips.length === 0 ? (
              <div className="empty-state">
                <h2>Nenhuma opção com estes filtros</h2>
                <p>Desmarque um filtro para voltar a ver as viagens.</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

