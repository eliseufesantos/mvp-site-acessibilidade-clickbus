interface StepProgressProps {
  activeStep: 1 | 2 | 3;
}

const steps = ['Viagem', 'Assento', 'Passageiro'];

export function StepProgress({ activeStep }: StepProgressProps) {
  return (
    <nav className="step-progress" aria-label="Etapas da compra">
      <ol>
        {steps.map((label, index) => {
          const number = index + 1;
          const state = number < activeStep ? 'complete' : number === activeStep ? 'active' : 'upcoming';
          return (
            <li className={`step-progress__item step-progress__item--${state}`} key={label} aria-current={state === 'active' ? 'step' : undefined}>
              <span className="step-progress__number" aria-hidden="true">
                {number < activeStep ? '✓' : number}
              </span>
              <span className="step-progress__label">
                <span className="sr-only">Etapa {number}: </span>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
