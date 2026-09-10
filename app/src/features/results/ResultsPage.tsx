import {
  ArrowLeft,
  ArrowRight,
  BusFront,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Route,
  SlidersHorizontal,
  Smartphone,
  Wifi,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ActiveModeBanner } from '../../components/accessibility/ActiveModeBanner';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { StepProgress } from '../../components/ui/StepProgress';
import { formatCurrency, getAvailableSeatCount, getTripsForRoute } from '../../data/trips';
import type { AccessibilityPreferences, SearchValues, ServiceClass, Trip } from '../../types';
import { formatTravelDate, shiftIsoDate } from '../../utils/date';

type SortMode = 'departure' | 'price';
type Period = 'all' | 'morning' | 'afternoon' | 'night';
type ClassFilter = 'all' | ServiceClass | 'sleeping';

interface ResultsPageProps {
  onBack: () => void;
  onChangeDate: (date: string) => void;
  onSelectTrip: (trip: Trip) => void;
  preferences: AccessibilityPreferences;
  search: SearchValues;
}

interface FilterFieldsProps {
  classFilter: ClassFilter;
  period: Period;
  setClassFilter: (value: ClassFilter) => void;
  setPeriod: (value: Period) => void;
  setSort: (value: SortMode) => void;
  sort: SortMode;
}

function FilterFields({ classFilter, period, setClassFilter, setPeriod, setSort, sort }: FilterFieldsProps) {
  return (
    <div className="filter-fields">
      <label>
        <span>Ordenar por</span>
        <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
          <option value="departure">Horário de saída</option>
          <option value="price">Menor preço</option>
        </select>
      </label>
      <fieldset>
        <legend>Hora da saída</legend>
        {([
          ['all', 'Qualquer horário'],
          ['morning', 'Manhã (06h–11h59)'],
          ['afternoon', 'Tarde (12h–17h59)'],
          ['night', 'Noite (18h–23h59)'],
        ] as const).map(([value, label]) => (
          <label className="check-row" key={value}>
            <input type="radio" name="period" checked={period === value} onChange={() => setPeriod(value)} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Tipo de assento</legend>
        {([
          ['all', 'Todos'],
          ['Executivo', 'Executivo'],
          ['Semi-leito', 'Semi-leito'],
          ['sleeping', 'Leito e leito-cama'],
        ] as const).map(([value, label]) => (
          <label className="check-row" key={value}>
            <input type="radio" name="class-filter" checked={classFilter === value} onChange={() => setClassFilter(value)} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export function ResultsPage({ onBack, onChangeDate, onSelectTrip, preferences, search }: ResultsPageProps) {
  const [sort, setSort] = useState<SortMode>('departure');
  const [period, setPeriod] = useState<Period>('all');
  const [classFilter, setClassFilter] = useState<ClassFilter>('all');
  const [detailsTrip, setDetailsTrip] = useState<Trip | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const routeTrips = useMemo(() => getTripsForRoute(search.origin, search.destination), [search.origin, search.destination]);
  const visibleTrips = useMemo(() => {
    const matchesPeriod = (trip: Trip) => {
      const hour = Number(trip.departure.slice(0, 2));
      if (period === 'morning') return hour >= 6 && hour < 12;
      if (period === 'afternoon') return hour >= 12 && hour < 18;
      if (period === 'night') return hour >= 18;
      return true;
    };
    const matchesClass = (trip: Trip) => {
      if (classFilter === 'all') return true;
      if (classFilter === 'sleeping') return trip.serviceClass === 'Leito' || trip.serviceClass === 'Leito-cama';
      return trip.serviceClass === classFilter;
    };
    return routeTrips
      .filter((trip) => matchesPeriod(trip) && matchesClass(trip))
      .sort((a, b) => (sort === 'price' ? a.price - b.price : a.departure.localeCompare(b.departure)));
  }, [classFilter, period, routeTrips, sort]);

  const clearFilters = () => {
    setSort('departure');
    setPeriod('all');
    setClassFilter('all');
  };
  const activeFilterCount = Number(period !== 'all') + Number(classFilter !== 'all') + Number(sort !== 'departure');
  const dateOptions = [-1, 0, 1].map((offset) => shiftIsoDate(search.date, offset));

  return (
    <div className="page-shell results-page">
      <div className="container">
        <StepProgress activeStep={1} />
        <ActiveModeBanner preferences={preferences} />
        <button className="back-link" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" size={19} /> Alterar busca
        </button>

        <section className="route-summary" aria-label="Busca atual">
          <div><span className="route-summary__label">Origem</span><strong>{search.origin}</strong></div>
          <ArrowRight aria-hidden="true" />
          <div><span className="route-summary__label">Destino</span><strong>{search.destination}</strong></div>
          <div className="route-summary__date"><span className="route-summary__label">Data</span><strong>{formatTravelDate(search.date)}</strong></div>
        </section>

        <div className="date-strip" aria-label="Escolher data de ida">
          {dateOptions.map((date) => (
            <button key={date} type="button" className={date === search.date ? 'date-strip__item date-strip__item--active' : 'date-strip__item'} onClick={() => onChangeDate(date)}>
              <CalendarDays aria-hidden="true" /> {formatTravelDate(date, { weekday: 'short', day: '2-digit', month: 'short' })}
            </button>
          ))}
        </div>

        <div className="results-heading">
          <div>
            <h1>Passagens disponíveis</h1>
            <p data-a11y-content-id="results-help">{visibleTrips.length} {visibleTrips.length === 1 ? 'opção encontrada' : 'opções encontradas'} para {formatTravelDate(search.date)}. Compare horários, embarque e comodidades antes de escolher.</p>
          </div>
          <Button className="mobile-filter-button" variant="secondary" onClick={() => setMobileFiltersOpen(true)}>
            <SlidersHorizontal aria-hidden="true" /> Filtros {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </Button>
        </div>

        {activeFilterCount > 0 ? (
          <div className="active-filters" aria-label="Filtros ativos">
            {sort === 'price' ? <span>Menor preço</span> : null}
            {period !== 'all' ? <span>{period === 'morning' ? 'Manhã' : period === 'afternoon' ? 'Tarde' : 'Noite'}</span> : null}
            {classFilter !== 'all' ? <span>{classFilter === 'sleeping' ? 'Leito e leito-cama' : classFilter}</span> : null}
            <button type="button" onClick={clearFilters}>Limpar filtros</button>
          </div>
        ) : null}

        <div className="results-layout">
          <aside className="filter-card" aria-labelledby="filters-title">
            <div className="filter-card__title"><SlidersHorizontal aria-hidden="true" size={21} /><h2 id="filters-title">Filtros</h2></div>
            <p className="filter-card__help" data-a11y-content-id="service-class-help">A classe descreve o tipo de serviço. Confira também as comodidades da viagem.</p>
            <FilterFields {...{ classFilter, period, setClassFilter, setPeriod, setSort, sort }} />
            {activeFilterCount > 0 ? <button className="filter-clear" type="button" onClick={clearFilters}>Limpar filtros</button> : null}
          </aside>

          <section className="trip-list" aria-label="Viagens disponíveis" aria-live="polite">
            {visibleTrips.map((trip) => (
              <article className="trip-card" key={trip.id}>
                <div className="trip-card__company">
                  <span className="trip-card__company-icon" aria-hidden="true"><BusFront size={22} /></span>
                  <div><strong>{trip.company}</strong><span>{trip.serviceClass}</span></div>
                  {trip.badge ? <span className="status-badge">{trip.badge}</span> : null}
                </div>

                <div className="trip-card__schedule" aria-label={`Saída ${trip.departure}, chegada ${trip.arrival}${trip.arrivesNextDay ? ' no dia seguinte' : ''}`}>
                  <div><strong>{trip.departure}</strong><span><MapPin aria-hidden="true" size={16} /> {trip.originTerminal}</span></div>
                  <div className="trip-card__duration"><span><Clock3 aria-hidden="true" size={16} /> {trip.duration}</span><i aria-hidden="true" /><span>Direto</span></div>
                  <div><strong>{trip.arrival}{trip.arrivesNextDay ? <sup>+1</sup> : null}</strong><span><MapPin aria-hidden="true" size={16} /> {trip.destinationTerminal}</span></div>
                </div>

                <div className="trip-card__amenities" aria-label="Comodidades">
                  <span><Wifi aria-hidden="true" /> {trip.amenities[0]}</span>
                  <span><Smartphone aria-hidden="true" /> Passagem digital</span>
                  <button type="button" onClick={() => setDetailsTrip(trip)}><Route aria-hidden="true" /> Ver itinerário</button>
                </div>

                <div className="trip-card__action">
                  <span>{getAvailableSeatCount(trip)} assentos livres</span>
                  <strong>{formatCurrency(trip.price)}</strong>
                  <small>por pessoa</small>
                  <Button variant="primary" onClick={() => onSelectTrip(trip)}>
                    Escolher viagem <ArrowRight aria-hidden="true" size={19} />
                  </Button>
                </div>
              </article>
            ))}
            {visibleTrips.length === 0 ? (
              <div className="empty-state">
                <h2>Nenhuma viagem encontrada</h2>
                <p>{routeTrips.length === 0 ? 'Esta rota ainda não está disponível no protótipo.' : 'Tente remover os filtros para ver outras opções.'}</p>
                {activeFilterCount > 0 ? <Button variant="secondary" onClick={clearFilters}>Limpar filtros</Button> : <Button variant="secondary" onClick={onBack}>Alterar rota</Button>}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {detailsTrip ? (
        <Dialog label={`Itinerário de ${detailsTrip.company}`} onClose={() => setDetailsTrip(null)}>
          <div className="trip-details">
            <span className="eyebrow">Detalhes da viagem</span>
            <h2>Embarque e desembarque</h2>
            <p id="trip-details">
              Viagem direta de {detailsTrip.originTerminal} para {detailsTrip.destinationTerminal}, com duração aproximada de {detailsTrip.duration}.
            </p>
            <ol>
              <li><span>{detailsTrip.departure}</span><div><strong>{detailsTrip.originTerminal}</strong><small>{detailsTrip.originAddress}</small></div></li>
              <li><span>{detailsTrip.arrival}{detailsTrip.arrivesNextDay ? ' (+1)' : ''}</span><div><strong>{detailsTrip.destinationTerminal}</strong><small>{detailsTrip.destinationAddress}</small></div></li>
            </ol>
            <p className="trip-details__notice"><Check aria-hidden="true" /> Chegue com pelo menos 30 minutos de antecedência. Dados fictícios para demonstração.</p>
          </div>
        </Dialog>
      ) : null}

      {mobileFiltersOpen ? (
        <Dialog label="Filtros de viagens" onClose={() => setMobileFiltersOpen(false)}>
          <div className="mobile-filter-dialog">
            <h2>Filtrar e ordenar</h2>
            <FilterFields {...{ classFilter, period, setClassFilter, setPeriod, setSort, sort }} />
            <div className="dialog-actions">
              <Button variant="quiet" onClick={clearFilters}>Limpar</Button>
              <Button onClick={() => setMobileFiltersOpen(false)}>Aplicar ({visibleTrips.length})</Button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
