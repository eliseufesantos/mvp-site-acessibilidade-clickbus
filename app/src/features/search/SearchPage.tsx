import { ArrowRight, CalendarDays, MapPin, Repeat2, Search, ShieldCheck, Tag } from 'lucide-react';
import { useState } from 'react';
import campaignImage from '../../assets/travel-campaign.png';
import { Button } from '../../components/ui/Button';
import { isKnownLocation } from '../../data/trips';
import type { SearchValues } from '../../types';
import { getTodayIso } from '../../utils/date';
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
    if (!isKnownLocation(values.origin) || !isKnownLocation(values.destination)) {
      setError('Escolha uma cidade da lista de locais atendidos no protótipo.');
      return;
    }
    if (values.origin === values.destination) {
      setError('Origem e destino precisam ser diferentes.');
      return;
    }
    setError('');
    onSearch(values);
  };

  const swapLocations = () => {
    setValues((current) => ({ ...current, origin: current.destination, destination: current.origin }));
  };

  const chooseOffer = (origin: string, destination: string) => {
    setValues((current) => ({ ...current, origin, destination }));
    window.requestAnimationFrame(() => document.getElementById('travel-date')?.focus());
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  return (
    <>
      <section className="campaign-hero" aria-labelledby="campaign-title">
        <img src={campaignImage} alt="Viajante diante de um ônibus em uma estrada entre montanhas" />
        <div className="container campaign-hero__content">
          <h1 id="campaign-title">Sua próxima viagem começa aqui</h1>
          <p>Encontre horários, compare opções e escolha seu assento com tranquilidade.</p>
          <span className="campaign-hero__notice"><ShieldCheck aria-hidden="true" /><span>Ambiente de demonstração, sem compra real</span></span>
        </div>
      </section>

      <section className="container search-area" aria-labelledby="search-title">
        <form className="search-card" onSubmit={submitSearch} noValidate>
          <div className="search-card__heading">
            <h2 id="search-title">Compre sua passagem de ônibus</h2>
            <span>Somente ida</span>
          </div>
          <div className="search-card__locations">
            <LocationCombobox
              label="Origem"
              name="origin"
              value={values.origin}
              onChange={(origin) => setValues((current) => ({ ...current, origin }))}
            />
            <button className="swap-button" type="button" aria-label="Trocar origem e destino" onClick={swapLocations}>
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
                min={getTodayIso()}
                required
                value={values.date}
                onChange={(event) => setValues((current) => ({ ...current, date: event.target.value }))}
              />
            </div>
          </div>

          <Button className="search-card__submit" type="submit" fullWidth>
            <Search aria-hidden="true" size={21} /> Buscar passagens <ArrowRight aria-hidden="true" size={21} />
          </Button>
          {error ? <p className="form-error search-card__error" role="alert">{error}</p> : null}
        </form>
      </section>

      <section className="container offers-section" id="ofertas" aria-labelledby="offers-title">
        <div className="section-heading section-heading--row">
          <div>
            <h2 id="offers-title">Passagens em destaque</h2>
            <p id="search-help">
              <span data-a11y-content-id="search-help">Escolha uma rota atendida, confira a data e use Buscar passagens.</span> Os valores e horários são fictícios.
            </p>
          </div>
          <Tag aria-hidden="true" />
        </div>
        <div className="offer-list">
          <button type="button" className="offer-card" onClick={() => chooseOffer('São Paulo (SP)', 'Rio de Janeiro (RJ)')}>
            <span><MapPin aria-hidden="true" /> São Paulo</span>
            <strong>Rio de Janeiro</strong>
            <small>A partir de R$ 119,90</small>
          </button>
          <article className="offer-card offer-card--informative" id="ajuda">
            <span><ShieldCheck aria-hidden="true" /> Viaje no seu ritmo</span>
            <strong>Ajustes acessíveis</strong>
            <small>Texto, contraste, espaçamento, controles, movimento e guia de leitura.</small>
          </article>
        </div>
      </section>
    </>
  );
}
