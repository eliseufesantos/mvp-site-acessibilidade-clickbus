/**
 * Matchers de DOM (`toBeInTheDocument`, `toHaveAttribute`,
 * `toHaveAccessibleDescription`…). São inofensivos nos testes de ambiente
 * `node`: só estendem o `expect`, e nenhum deles é usado sem DOM.
 */
import '@testing-library/jest-dom/vitest';
