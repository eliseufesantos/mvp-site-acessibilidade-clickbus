/**
 * Decisões da sessão de ditado, isoladas do React para poderem ser testadas.
 *
 * O navegador encerra o reconhecimento por conta própria depois de um trecho de
 * silêncio, mesmo com `continuous = true`. Sem religar, quem formula uma frase
 * mais longa — ou pensa entre as palavras — perde a sessão no meio, sem nenhuma
 * explicação na tela. Religar é o comportamento esperado; o que precisa de
 * critério é quando NÃO religar.
 */

// Teto de escuta por acionamento. Existe para que um microfone esquecido aberto
// não fique religando indefinidamente: o ditado é de um pedido curto.
export const MAX_LISTENING_MS = 120_000;

/** Erros que não adianta repetir: religar produziria o mesmo erro em laço. */
const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported']);

export const isFatalVoiceError = (code: string): boolean => FATAL_ERRORS.has(code);

export interface VoiceErrorMessage {
  text: string;
  fatal: boolean;
}

export const describeVoiceError = (code: string): VoiceErrorMessage => {
  if (code === 'not-allowed' || code === 'service-not-allowed') {
    return { text: 'O microfone está bloqueado. Autorize o microfone para este site e tente de novo.', fatal: true };
  }
  if (code === 'audio-capture') {
    return { text: 'Nenhum microfone foi encontrado. Conecte um microfone e tente de novo.', fatal: true };
  }
  if (code === 'language-not-supported') {
    return { text: 'Este navegador não reconhece ditado em português. Digite o pedido no campo.', fatal: true };
  }
  // `no-speech`, `network` e `aborted` passam sozinhos: a sessão religa.
  return { text: '', fatal: false };
};

export interface KeepListeningInput {
  /** A pessoa clicou em parar. Encerrar é a intenção dela, não uma falha. */
  requestedStop: boolean;
  /** Houve um erro que se repetiria a cada nova tentativa. */
  fatalError: boolean;
  /** Milissegundos desde o acionamento do microfone. */
  elapsedMs: number;
  budgetMs?: number;
}

/**
 * Se a sessão deve ser religada depois de o navegador encerrá-la sozinho.
 */
export const shouldKeepListening = ({
  requestedStop,
  fatalError,
  elapsedMs,
  budgetMs = MAX_LISTENING_MS,
}: KeepListeningInput): boolean => !requestedStop && !fatalError && elapsedMs < budgetMs;

/**
 * Junta o texto das sessões já encerradas com o da sessão em curso.
 *
 * `event.results` recomeça do zero a cada religamento, então sem acumular o
 * texto anterior cada religamento apagaria o que a pessoa já tinha ditado.
 */
export const joinTranscript = (committed: string, live: string): string =>
  [committed.trim(), live.trim()].filter(Boolean).join(' ');
