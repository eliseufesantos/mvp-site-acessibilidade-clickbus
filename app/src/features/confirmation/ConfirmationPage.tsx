import { BusFront, CheckCircle2, Home, RotateCcw, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../data/trips';
import type { SearchValues, Trip } from '../../types';

interface ConfirmationPageProps {
  onRestart: () => void;
  search: SearchValues;
  seat: number;
  trip: Trip;
}

export function ConfirmationPage({ onRestart, search, seat, trip }: ConfirmationPageProps) {
  return (
    <div className="page-shell confirmation-page">
      <div className="container confirmation-page__inner">
        <div className="confirmation-icon" aria-hidden="true"><CheckCircle2 /></div>
        <span className="eyebrow">Demonstração concluída</span>
        <h1>Simulação finalizada com sucesso</h1>
        <p className="confirmation-page__lead">
          Você percorreu a busca, escolheu uma viagem e selecionou um assento. Nenhuma cobrança foi feita.
        </p>

        <section className="confirmation-ticket" aria-label="Resumo da simulação">
          <div className="confirmation-ticket__route">
            <BusFront aria-hidden="true" />
            <div><span>Origem</span><strong>{search.origin}</strong></div>
            <div><span>Destino</span><strong>{search.destination}</strong></div>
          </div>
          <dl>
            <div><dt>Empresa</dt><dd>{trip.company}</dd></div>
            <div><dt>Horário</dt><dd>{trip.departure}</dd></div>
            <div><dt>Assento</dt><dd>{seat}</dd></div>
            <div><dt>Total simulado</dt><dd>{formatCurrency(trip.price)}</dd></div>
          </dl>
        </section>

        <div className="confirmation-assurance">
          <ShieldCheck aria-hidden="true" />
          <span>Dados não enviados · Pagamento não processado · Preferências visuais preservadas</span>
        </div>

        <Button onClick={onRestart}>
          <RotateCcw aria-hidden="true" /> Fazer nova simulação
        </Button>
        <a className="home-link" href="#inicio" onClick={(event) => { event.preventDefault(); onRestart(); }}>
          <Home aria-hidden="true" /> Voltar ao início
        </a>
      </div>
    </div>
  );
}

