import { ArrowLeft, ArrowRight, Armchair, BusFront, CheckCircle2, MapPin } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { ActiveModeBanner } from '../../components/accessibility/ActiveModeBanner';
import { Button } from '../../components/ui/Button';
import { StepProgress } from '../../components/ui/StepProgress';
import { formatCurrency } from '../../data/trips';
import type { AccessibilityPreferences, SearchValues, Trip } from '../../types';

interface SeatSelectionPageProps {
  onBack: () => void;
  onContinue: () => void;
  onSelectSeat: (seat: number) => void;
  preferences: AccessibilityPreferences;
  search: SearchValues;
  selectedSeat: number | null;
  trip: Trip;
}

const seatNumbers = Array.from({ length: 16 }, (_, index) => index + 49);
const occupiedSeats = new Set([52, 56, 60]);

export function SeatSelectionPage({
  onBack,
  onContinue,
  onSelectSeat,
  preferences,
  search,
  selectedSeat,
  trip,
}: SeatSelectionPageProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const availableSeats = useMemo(() => seatNumbers.filter((seat) => !occupiedSeats.has(seat)), []);

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-seat]');
    if (!target) return;

    const currentSeat = Number(target.dataset.seat);
    const currentIndex = availableSeats.indexOf(currentSeat);
    const columns = 4;
    const direction = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -columns,
      ArrowDown: columns,
    }[event.key];

    if (direction === undefined) return;
    event.preventDefault();
    const nextIndex = Math.max(0, Math.min(currentIndex + direction, availableSeats.length - 1));
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-seat="${availableSeats[nextIndex]}"]`)
      ?.focus();
  };

  return (
    <div className="page-shell">
      <div className="container">
        <StepProgress activeStep={2} />
        <ActiveModeBanner preferences={preferences} />
        <button className="back-link" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" size={19} /> Voltar aos resultados
        </button>

        <div className="seats-layout">
          <aside className="journey-card">
            <span className="eyebrow">Passo 2 de 3</span>
            <h1>Escolha seu assento</h1>
            <div className="company-line">
              <BusFront aria-hidden="true" />
              <div><strong>{trip.company}</strong><span>{trip.serviceClass}</span></div>
            </div>
            <div className="journey-card__route">
              <MapPin aria-hidden="true" />
              <strong>{search.origin}</strong>
              <ArrowRight aria-hidden="true" />
              <strong>{search.destination}</strong>
            </div>
            <dl className="journey-card__details">
              <div><dt>Horário</dt><dd>{trip.departure}</dd></div>
              <div><dt>Valor</dt><dd>{formatCurrency(trip.price)}</dd></div>
              <div><dt>Assento</dt><dd>{selectedSeat ?? 'Selecione'}</dd></div>
            </dl>
            {selectedSeat ? (
              <div className="selection-message" role="status">
                <CheckCircle2 aria-hidden="true" /> Assento {selectedSeat} selecionado
              </div>
            ) : (
              <p className="journey-card__hint">Use Tab ou as setas do teclado para navegar pelos assentos.</p>
            )}
          </aside>

          <section className="seat-picker" aria-labelledby="seat-title">
            <div className="seat-picker__heading">
              <div>
                <span className="eyebrow">Mapa simplificado</span>
                <h2 id="seat-title">Assentos disponíveis</h2>
              </div>
              <div className="seat-legend" aria-label="Legenda">
                <span><i className="legend-free" /> Livre</span>
                <span><i className="legend-selected" /> Selecionado</span>
                <span><i className="legend-occupied" /> Ocupado</span>
              </div>
            </div>

            <div className="bus-shell">
              <div className="bus-shell__front">
                <Armchair aria-hidden="true" /> Frente do ônibus
              </div>
              <div className="seat-grid" ref={gridRef} role="group" aria-label="Mapa de assentos" onKeyDown={handleGridKeyDown}>
                {seatNumbers.map((seat, index) => {
                  const occupied = occupiedSeats.has(seat);
                  const selected = seat === selectedSeat;
                  return (
                    <button
                      className={`seat${selected ? ' seat--selected' : ''}${occupied ? ' seat--occupied' : ''}${index % 4 === 2 ? ' seat--aisle' : ''}`}
                      type="button"
                      key={seat}
                      data-seat={seat}
                      disabled={occupied}
                      aria-pressed={selected}
                      aria-label={`Assento ${seat}, ${occupied ? 'ocupado' : selected ? 'selecionado' : 'livre'}`}
                      onClick={() => onSelectSeat(seat)}
                    >
                      {occupied ? '×' : seat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="seat-picker__footer">
              <span>{selectedSeat ? `Assento ${selectedSeat} pronto para continuar` : 'Selecione um assento livre'}</span>
              <Button onClick={onContinue} disabled={!selectedSeat}>
                Continuar <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

