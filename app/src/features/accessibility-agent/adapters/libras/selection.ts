import type { RybenaAdapter } from './contracts';
import { RybenaBrowserAdapter } from './rybenaBrowser';
import { RybenaDevelopmentAdapter } from './rybenaDevelopment';

/**
 * Seleção do adaptador de Libras. Trate como código de segurança: um adaptador
 * simulado que vazasse para produção viraria alegação falsa de tradução em
 * Libras, que a regra 8 do `AGENTS.md` proíbe.
 *
 * Duas barreiras independentes:
 *
 * 1. `import.meta.env.DEV` aparece **literalmente** no ternário abaixo. O
 *    empacotador substitui esse identificador por `false` na build de
 *    produção, dobra o `&&` e remove a referência a `RybenaDevelopmentAdapter`,
 *    que deixa de existir no bundle. Não extraia essa checagem para uma
 *    variável nem para dentro de `shouldSimulateLibras`: isso quebraria a
 *    dobra estática e o adaptador falso passaria a ser empacotado.
 * 2. `shouldSimulateLibras` exige, além de desenvolvimento, uma variável de
 *    ativação explícita. Ela é pura e coberta por teste.
 *
 * A flag não é segredo: ela só liga um double local e nunca carrega credencial.
 */

export const LIBRAS_SIMULATION_ENV_VAR = 'VITE_A11Y_LIBRAS_SIMULATION';
export const LIBRAS_SIMULATION_ENABLED_VALUE = 'on';

export interface LibrasEnvironment {
  /** `true` somente no servidor de desenvolvimento do Vite. */
  dev: boolean;
  /** Valor de `VITE_A11Y_LIBRAS_SIMULATION`, quando definido. */
  simulation: string | undefined;
}

export const shouldSimulateLibras = (environment: LibrasEnvironment): boolean =>
  environment.dev === true && environment.simulation === LIBRAS_SIMULATION_ENABLED_VALUE;

export const librasAdapter: RybenaAdapter = import.meta.env.DEV
  && shouldSimulateLibras({ dev: true, simulation: import.meta.env.VITE_A11Y_LIBRAS_SIMULATION })
  ? new RybenaDevelopmentAdapter()
  : new RybenaBrowserAdapter();
