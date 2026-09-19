import type { AccessibilityPreferences } from '../../types';

/**
 * Camada de saturação e correção de cores.
 *
 * O efeito vem de `backdrop-filter` numa camada fixa, e não de `filter` num
 * ancestral: `filter` transformaria esse ancestral em bloco de contenção para
 * descendentes `position: fixed`, e o painel de acessibilidade, os diálogos e a
 * máscara de leitura parariam de se posicionar pela viewport.
 *
 */

interface ColorFiltersProps {
  colorFilter: AccessibilityPreferences['colorFilter'];
  saturation: AccessibilityPreferences['saturation'];
}

/**
 * Matrizes de **daltonização**, não de simulação.
 *
 * A primeira versão usava as matrizes de simulação de dicromacia que circulam
 * em ferramentas de "colorblind simulator". Elas fazem o oposto do prometido:
 * medida a separação euclidiana entre vermelho e verde puros, a de
 * deuteranopia caía de 1,414 para 0,559 — o controle chamado "correção"
 * tornava as cores *menos* distinguíveis para quem o escolhesse.
 *
 * Estas são `D = I + E·(I − S)`, onde `S` simula a deficiência e `E`
 * redistribui o erro para os canais que a pessoa ainda separa. A escolha de `E`
 * não foi por intuição: foi medida sobre oito pares de cores comumente
 * confundidos, e a suíte de testes reprova qualquer matriz que reduza a
 * separação média ou piore o pior par.
 *
 * **Limite honesto.** Continua sendo aproximação, derivada de um modelo linear
 * simples e de um conjunto pequeno de pares. Não foi validada com pessoas com
 * dicromacia, não é simulação clínica, não corrige contraste insuficiente e não
 * substitui outro sinal além da cor.
 */
export const COLOR_CORRECTION_MATRICES: Record<Exclude<AccessibilityPreferences['colorFilter'], 'none'>, string> = {
  protanopia: '1.183 -0.2705 0.0875 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0',
  deuteranopia: '1.375 -0.585 0.21 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0',
  tritanopia: '1 0 0 0 0  0 1.2345 -0.2345 0 0  0 0 1 0 0  0 0 0 1 0',
};

export function ColorFilters({ colorFilter, saturation }: ColorFiltersProps) {
  const active = colorFilter !== 'none' || saturation !== 'default';

  return (
    <>
      {/* As definições ficam sempre no documento: uma referência `url(#id)` só
          resolve se o filtro existir quando o estilo é aplicado. */}
      <svg className="sr-only" aria-hidden="true" focusable="false">
        <defs>
          {(Object.keys(COLOR_CORRECTION_MATRICES) as (keyof typeof COLOR_CORRECTION_MATRICES)[]).map((name) => (
            <filter key={name} id={`a11y-${name}`} colorInterpolationFilters="linearRGB">
              <feColorMatrix type="matrix" values={COLOR_CORRECTION_MATRICES[name]} />
            </filter>
          ))}
        </defs>
      </svg>
      {active ? <div className="color-filter-layer" aria-hidden="true" /> : null}
    </>
  );
}
