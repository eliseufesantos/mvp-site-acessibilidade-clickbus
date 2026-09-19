import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

export interface FeatureCard<Id extends string> {
  id: Id;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Texto curto de estado, quando o recurso depende de algo externo. */
  note?: string;
}

interface FeatureGridProps<Id extends string> {
  cards: readonly FeatureCard<Id>[];
  onOpen(id: Id): void;
}

/**
 * Grade de cartões da superfície raiz. Cada cartão é um `<button>` que navega
 * para outra superfície dentro do painel — nunca um `role="tab"`: uma grade de
 * botões é percorrida por `Tab`, e recriar a navegação por setas das abas aqui
 * confundiria o modelo de teclado.
 */
export function FeatureGrid<Id extends string>({ cards, onOpen }: FeatureGridProps<Id>) {
  return (
    <div className="a11y-card-grid">
      {cards.map(({ id, label, description, icon: Icon, note }, index) => (
        <button
          key={id}
          id={`a11y-card-${id}`}
          className="a11y-card"
          type="button"
          data-a11y-entry={index === 0 ? 'true' : undefined}
          onClick={() => onOpen(id)}
        >
          <span className="a11y-card__icon" aria-hidden="true"><Icon /></span>
          <span className="a11y-card__body">
            <strong>{label}</strong>
            <small>{description}</small>
            {note ? <em>{note}</em> : null}
          </span>
          <ChevronRight className="a11y-card__chevron" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
