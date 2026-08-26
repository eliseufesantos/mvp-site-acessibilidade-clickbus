import { ArrowRight, CalendarDays, Repeat2, Search, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { useState } from 'react';
import type { SearchValues } from '../../types';
import { Button } from '../../components/ui/Button';
import { LocationCombobox } from './LocationCombobox';

interface SearchPageProps {
  initialValues: SearchValues;
  onSearch: (values: SearchValues) => void;
}

export function SearchPage({ initialValues, onSearch }: SearchPageProps) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (values.origin === values.destination) {
      setError('Origem e destino precisam ser diferentes.');
      return;
    }
    setError('');
    onSearch(values);
  };

  const swapLocations = () => {
    setValues((current) => ({
      ...current,
      origin: current.destination,
      destination: current.origin,
    }));
  };

  return (
    <>
      <section className="search-hero">
        <div className="search-hero__decoration" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="container search-hero__content">
          <div className="eyebrow eyebrow--inverse">
            <Sparkles aria-hidden="true" size={18} /> Protótipo acadêmico acessível
          </div>
          <h1>Compre sua passagem de ônibus</h1>
          <p>Uma simulação simples, clara e ajustável para diferentes necessidades visuais.</p>

          <form className="search-card" onSubmit={submitSearch}>
            <div className="search-card__locations">
              <LocationCombobox
                label="Origem"
                name="origin"
                value={values.origin}
                onChange={(origin) => setValues((current) => ({ ...current, origin }))}
              />
              <button
                className="swap-button"
                type="button"
                aria-label="Trocar origem e destino"
                onClick={swapLocations}
              >
                <Repeat2 aria-hidden="true" size={22} />
              </button>
              <LocationCombobox
                label="Destino"
                name="destination"
                value={values.destination}
                onChange={(destination) => setValues((current) => ({ ...current, destination }))}
              />
            </div>

            <div className="field">
              <label htmlFor="travel-date">Data da viagem</label>
              <div className="field__control">
                <CalendarDays aria-hidden="true" size={20} />
                <input
                  id="travel-date"
                  name="date"
                  type="date"
                  min="2026-08-26"
                  required
                  value={values.date}
                  onChange={(event) => setValues((current) => ({ ...current, date: event.target.value }))}
                />
              </div>
            </div>

            <Button className="search-card__submit" type="submit" fullWidth>
              <Search aria-hidden="true" size={21} />
              Buscar passagens
              <ArrowRight aria-hidden="true" size={21} />
            </Button>
            {error ? <p className="form-error search-card__error">{error}</p> : null}
          </form>
        </div>
      </section>

      <section className="container benefit-section" aria-labelledby="benefit-title">
        <div className="section-heading">
          <span className="eyebrow">Ganhos do MVP</span>
          <h2 id="benefit-title">Acessibilidade útil desde o primeiro clique</h2>
        </div>
        <div className="benefit-grid">
          <article className="benefit-card">
            <ShieldCheck aria-hidden="true" />
            <h3>Preferências persistentes</h3>
            <p>Contraste, tamanho e movimento continuam ativos durante toda a jornada.</p>
          </article>
          <article className="benefit-card">
            <WalletCards aria-hidden="true" />
            <h3>Simulação segura</h3>
            <p>Nenhum dado é enviado e nenhum pagamento é processado neste protótipo.</p>
          </article>
          <article className="benefit-card hide-in-elderly">
            <Sparkles aria-hidden="true" />
            <h3>Menos esforço visual</h3>
            <p>Foco evidente, mensagens claras e controles com área confortável de toque.</p>
          </article>
        </div>
      </section>
    </>
  );
}

