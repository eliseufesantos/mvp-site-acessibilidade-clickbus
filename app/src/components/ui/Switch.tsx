import { useId } from 'react';

interface SwitchProps {
  checked: boolean;
  description: string;
  label: string;
  onChange: () => void;
}

export function Switch({ checked, description, label, onChange }: SwitchProps) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div className="switch-row">
      <div>
        <span className="switch-row__label" id={labelId}>
          {label}
        </span>
        <span className="switch-row__description" id={descriptionId}>
          {description}
        </span>
      </div>
      <button
        className="switch"
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        onClick={onChange}
      >
        <span className="switch__thumb" aria-hidden="true" />
      </button>
    </div>
  );
}
