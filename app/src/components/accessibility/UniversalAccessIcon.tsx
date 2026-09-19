interface UniversalAccessIconProps {
  className?: string;
}

/**
 * Símbolo universal de acesso — figura com os braços abertos.
 *
 * É o pictograma convencional de acessibilidade na web, desenhado aqui em vez
 * de reaproveitar o ícone de wheelchair do conjunto Lucide, que representa
 * especificamente mobilidade e comunica menos do que o painel oferece.
 *
 * Desenho geométrico próprio: não reproduz a arte de nenhum portal usado como
 * referência visual.
 */
export function UniversalAccessIcon({ className }: UniversalAccessIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="4.4" r="2.2" fill="currentColor" />
      <path
        d="M3.9 8.9c2.6.95 5.3 1.42 8.1 1.42s5.5-.47 8.1-1.42"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M12 10.3v4.5l-2.7 6.4M12 14.8l2.7 6.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
