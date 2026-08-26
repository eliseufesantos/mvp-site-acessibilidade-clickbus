interface VLibrasPlayer {
  translateAndPlay?: (text: string) => unknown;
}

declare global {
  interface Window {
    vlibras?: VLibrasPlayer;
  }
}

/**
 * Envia um texto direto para o avatar do VLibras.
 *
 * Por padrão o widget traduz o que a pessoa seleciona com o mouse, e isso não
 * funciona em interface efêmera: clicar numa opção de combobox fecha a lista
 * antes de existir qualquer seleção. O player expõe `window.vlibras`, que
 * aceita o texto de uma vez e dispensa a seleção.
 *
 * Essa API não é documentada, então nada aqui é obrigatório: se ela mudar de
 * nome, a navegação continua idêntica e apenas a leitura automática deixa de
 * acontecer. `window.vlibras` também só existe depois que a pessoa abre o
 * player, que é justamente quando essa leitura importa.
 */
export const signLibras = (text: string) => {
  const play = window.vlibras?.translateAndPlay;
  if (!play || !text.trim()) return;

  // "São Paulo (SP)" vira "São Paulo, SP": o tradutor lida melhor com vírgula
  // do que com parênteses.
  const clean = text.replace(/\s*\((.+?)\)\s*/g, ', $1').trim();

  try {
    void Promise.resolve(play.call(window.vlibras, clean)).catch(() => undefined);
  } catch {
    // um erro do player nunca deve interromper a jornada
  }
};
