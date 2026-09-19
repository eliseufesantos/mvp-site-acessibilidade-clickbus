import type { LucideIcon } from 'lucide-react';

export interface FeatureCard<Id extends string> {
  id: Id;
  label: string;
  /** Lido por leitor de tela; não aparece no cartão, que é deliberadamente enxuto. */
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
 * Grade 2×2 de cartões quadrados, ícone acima do rótulo.
 *
 * Cada cartão é um `<button>` que navega para outra superfície — nunca um
 * `role="tab"`: uma grade de botões é percorrida por `Tab`, e recriar a
 * navegação por setas das abas aqui confundiria o modelo de teclado.
 *
 * O cartão mostra só o rótulo, para ficar legível de relance. A descrição vai
 * em `aria-describedby`, então quem usa leitor de tela continua ouvindo o que
 * cada recurso faz antes de entrar.
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
          aria-describedby={`a11y-card-${id}-hint`}
          onClick={() => onOpen(id)}
        >
          <span className="a11y-card__icon" aria-hidden="true"><Icon /></span>
          <span className="a11y-card__label">{label}</span>
          {note ? <span className="a11y-card__note">{note}</span> : null}
          <span className="sr-only" id={`a11y-card-${id}-hint`}>{description}</span>
        </button>
      ))}
    </div>
  );
}
