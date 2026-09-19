import type { AccessibilityPreferences } from '../../types';

/**
 * Camada de saturação e correção de cores.
 *
 * O efeito vem de `backdrop-filter` numa camada fixa, e não de `filter` num
 * ancestral: `filter` transformaria esse ancestral em bloco de contenção para
 * descendentes `position: fixed`, e o painel de acessibilidade, os diálogos e a
 * máscara de leitura parariam de se posicionar pela viewport.
 *
 * As matrizes são aproximações de daltonização para dicromacias, no espírito
 * dos filtros de correção de cor: aumentam a separação entre matizes
 * confundíveis deslocando parte do canal perdido para os canais preservados.
 * **Não** são simulação clínica, não corrigem contraste insuficiente e não
 * substituem outro sinal além da cor.
 */

interface ColorFiltersProps {
  colorFilter: AccessibilityPreferences['colorFilter'];
  saturation: AccessibilityPreferences['saturation'];
}

const MATRICES: Record<Exclude<AccessibilityPreferences['colorFilter'], 'none'>, string> = {
  protanopia:
    '0.817 0.183 0 0 0  0.333 0.667 0 0 0  0 0.125 0.875 0 0  0 0 0 1 0',
  deuteranopia:
    '0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0',
  tritanopia:
    '0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0',
};

export function ColorFilters({ colorFilter, saturation }: ColorFiltersProps) {
  const active = colorFilter !== 'none' || saturation !== 'default';

  return (
    <>
      {/* As definições ficam sempre no documento: uma referência `url(#id)` só
          resolve se o filtro existir quando o estilo é aplicado. */}
      <svg className="sr-only" aria-hidden="true" focusable="false">
        <defs>
          {(Object.keys(MATRICES) as (keyof typeof MATRICES)[]).map((name) => (
            <filter key={name} id={`a11y-${name}`} colorInterpolationFilters="linearRGB">
              <feColorMatrix type="matrix" values={MATRICES[name]} />
            </filter>
          ))}
        </defs>
      </svg>
      {active ? <div className="color-filter-layer" aria-hidden="true" /> : null}
    </>
  );
}
