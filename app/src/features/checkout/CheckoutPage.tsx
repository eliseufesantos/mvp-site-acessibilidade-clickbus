import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BusFront,
  CalendarDays,
  Check,
  Clock3,
  GraduationCap,
  IdCard,
  Info,
  MapPin,
  UserRound,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { ActiveModeBanner } from '../../components/accessibility/ActiveModeBanner';
import { Button } from '../../components/ui/Button';
import { StepProgress } from '../../components/ui/StepProgress';
import { formatCurrency } from '../../data/trips';
import type { AccessibilityPreferences, SearchValues, Trip } from '../../types';

interface CheckoutPageProps {
  onBack: () => void;
  onComplete: () => void;
  preferences: AccessibilityPreferences;
  search: SearchValues;
  seat: number;
  trip: Trip;
}

interface FormValues {
  name: string;
  cpf: string;
  birthDate: string;
  consent: boolean;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = { name: '', cpf: '', birthDate: '', consent: false };

const formatBirthDate = (input: string) => {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export function CheckoutPage({ onBack, onComplete, preferences, search, seat, trip }: CheckoutPageProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const updateField = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (values.name.trim().length < 3) nextErrors.name = 'Informe o nome completo do passageiro.';
    if (!/^\d{11}$/.test(values.cpf.replace(/\D/g, ''))) nextErrors.cpf = 'Informe um CPF fictício com 11 números.';
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(values.birthDate)) {
      nextErrors.birthDate = 'Informe a data no formato DD/MM/AAAA.';
    }
    if (!values.consent) nextErrors.consent = 'Confirme que você entendeu que esta é uma simulação.';
    return nextErrors;
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    onComplete();
  };

  return (
    <div className="page-shell">
      <div className="container">
        <StepProgress activeStep={3} />
        <ActiveModeBanner preferences={preferences} />
        <button className="back-link" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" size={19} /> Voltar aos assentos
        </button>

        <div className="simulation-notice" role="note">
          <GraduationCap aria-hidden="true" />
          <div>
            <strong>Simulação: nenhum pagamento será processado.</strong>
            <span>Use somente informações fictícias. Nenhum dado sai deste navegador.</span>
          </div>
        </div>

        <form className="checkout-layout" onSubmit={submit} noValidate>
          <section className="passenger-card" aria-labelledby="passenger-title">
            <span className="eyebrow">Passo 3 de 3</span>
            <h1 id="passenger-title">Dados do passageiro</h1>
            <p>Todos os campos são obrigatórios. Preencha com dados fictícios para concluir o teste.</p>

            {Object.keys(errors).length > 0 ? (
              <div className="error-summary" role="alert" tabIndex={-1} ref={errorSummaryRef}>
                <AlertCircle aria-hidden="true" />
                <div>
                  <strong>Revise os campos destacados</strong>
                  <span>Há {Object.keys(errors).length} {Object.keys(errors).length === 1 ? 'item pendente' : 'itens pendentes'}.</span>
                </div>
              </div>
            ) : null}

            <div className={`field${errors.name ? ' field--error' : ''}`}>
              <label htmlFor="passenger-name">Nome completo</label>
              <div className="field__control">
                <UserRound aria-hidden="true" />
                <input
                  id="passenger-name"
                  autoComplete="off"
                  value={values.name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'passenger-name-error' : undefined}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Ex.: Maria da Silva"
                />
              </div>
              {errors.name ? <span id="passenger-name-error" className="field__error"><AlertCircle aria-hidden="true" />{errors.name}</span> : null}
            </div>

            <div className={`field${errors.cpf ? ' field--error' : ''}`}>
              <label htmlFor="passenger-cpf">CPF fictício</label>
              <div className="field__control">
                <IdCard aria-hidden="true" />
                <input
                  id="passenger-cpf"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={11}
                  value={values.cpf}
                  aria-invalid={Boolean(errors.cpf)}
                  aria-describedby={errors.cpf ? 'passenger-cpf-error' : undefined}
                  onChange={(event) => updateField('cpf', event.target.value.replace(/\D/g, ''))}
                  placeholder="Somente 11 números"
                />
              </div>
              {errors.cpf ? <span id="passenger-cpf-error" className="field__error"><AlertCircle aria-hidden="true" />{errors.cpf}</span> : null}
            </div>

            <div className={`field${errors.birthDate ? ' field--error' : ''}`}>
              <label htmlFor="passenger-birth">Data de nascimento</label>
              <div className="field__control">
                <CalendarDays aria-hidden="true" />
                <input
                  id="passenger-birth"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={values.birthDate}
                  aria-invalid={Boolean(errors.birthDate)}
                  aria-describedby={errors.birthDate ? 'passenger-birth-error' : undefined}
                  onChange={(event) => updateField('birthDate', formatBirthDate(event.target.value))}
                  placeholder="DD/MM/AAAA"
                />
              </div>
              {errors.birthDate ? <span id="passenger-birth-error" className="field__error"><AlertCircle aria-hidden="true" />{errors.birthDate}</span> : null}
            </div>

            <p className="field-note"><Info aria-hidden="true" /> As informações são mantidas apenas na memória desta página.</p>

            <label className={`consent-row${errors.consent ? ' consent-row--error' : ''}`}>
              <input
                type="checkbox"
                checked={values.consent}
                aria-invalid={Boolean(errors.consent)}
                onChange={(event) => updateField('consent', event.target.checked)}
              />
              <span>Entendi que este fluxo é acadêmico e não gera uma passagem real.</span>
            </label>
            {errors.consent ? <span className="field__error"><AlertCircle aria-hidden="true" />{errors.consent}</span> : null}
          </section>

          <aside className="checkout-summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Resumo da viagem</h2>
            <div className="summary-route">
              <MapPin aria-hidden="true" />
              <div><strong>{search.origin}</strong><span>Terminal Tietê</span></div>
              <ArrowRight aria-hidden="true" />
              <div><strong>{search.destination}</strong><span>Rodoviária do Rio</span></div>
            </div>
            <dl>
              <div><dt><BusFront aria-hidden="true" /> Empresa</dt><dd>{trip.company}</dd></div>
              <div><dt><CalendarDays aria-hidden="true" /> Data</dt><dd>30 de agosto</dd></div>
              <div><dt><Clock3 aria-hidden="true" /> Saída</dt><dd>{trip.departure}</dd></div>
              <div><dt><Check aria-hidden="true" /> Assento</dt><dd>{seat}</dd></div>
            </dl>
            <div className="checkout-summary__total">
              <span>Total da simulação</span>
              <strong>{formatCurrency(trip.price)}</strong>
            </div>
            <Button className="checkout-submit" variant="yellow" type="submit" fullWidth>
              <GraduationCap aria-hidden="true" /> Concluir simulação <ArrowRight aria-hidden="true" />
            </Button>
          </aside>
        </form>
      </div>
    </div>
  );
}
