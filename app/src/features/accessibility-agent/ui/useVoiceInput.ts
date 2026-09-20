import { useEffect, useRef, useState } from 'react';
import {
  MAX_LISTENING_MS,
  describeVoiceError,
  joinTranscript,
  shouldKeepListening,
} from '../core/voiceSession';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getConstructor = (): SpeechRecognitionConstructor | null => {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
};

export const useVoiceInput = () => {
  const [transcript, setTranscript] = useState('');
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Texto das sessões já encerradas. `event.results` recomeça do zero a cada
  // religamento, então sem este acumulador cada religamento apagaria o ditado.
  const committedRef = useRef('');
  const liveRef = useRef('');
  // A intenção da pessoa: enquanto for `true`, o fim de uma sessão religa.
  const listeningRef = useRef(false);
  const fatalRef = useRef(false);
  const startedAtRef = useRef(0);
  // Cada acionamento do microfone é uma geração. Os callbacks de uma sessão só
  // agem enquanto a geração deles for a corrente: sem isso, o `onend` atrasado
  // de uma sessão encerrada agia sobre os refs — que são compartilhados — e
  // podia religar o reconhecedor velho por cima do novo.
  const generationRef = useRef(0);
  const supported = getConstructor() !== null;

  const stop = () => {
    listeningRef.current = false;
    // Fecha o trecho aqui: com a sessão invalidada, o `onend` dela não vai mais
    // fazê-lo, e o que foi dito seria perdido.
    committedRef.current = joinTranscript(committedRef.current, liveRef.current);
    liveRef.current = '';
    // Invalida a sessão antes de liberar a interface. Como `stop()` passou a
    // encerrar a escuta sem esperar o `onend`, dava para acionar o microfone de
    // novo antes de o evento antigo chegar; ele então via `listeningRef` já
    // rearmado pela nova sessão e religava o reconhecedor velho, deixando dois
    // em curso e misturando as transcrições.
    generationRef.current += 1;
    // Encerra a escuta na interface sem depender de `onend`: quando a sessão
    // nunca chegou a começar, `stop()` não emite evento nenhum e o botão
    // ficaria travado em "parar".
    setActive(false);
    recognitionRef.current?.stop();
  };

  const reset = () => {
    committedRef.current = '';
    liveRef.current = '';
    setTranscript('');
  };

  const openSession = () => {
    const Constructor = getConstructor();
    if (!Constructor) return;
    const generation = generationRef.current;
    const isCurrent = () => generationRef.current === generation;
    const recognition = new Constructor();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      if (!isCurrent()) return;
      let sessionText = '';
      for (let index = 0; index < event.results.length; index += 1) {
        sessionText += event.results[index][0]?.transcript ?? '';
      }
      liveRef.current = sessionText;
      setTranscript(joinTranscript(committedRef.current, sessionText));
    };

    recognition.onerror = (event) => {
      if (!isCurrent()) return;
      const described = describeVoiceError(event?.error ?? '');
      if (described.fatal) {
        fatalRef.current = true;
        listeningRef.current = false;
        setError(described.text);
        // `onend` não é garantido depois de um erro fatal: com o microfone
        // bloqueado pelo navegador, a sessão nunca começa e o evento pode não
        // vir. Sem isto a interface ficava presa anunciando "Ouvindo" ao lado
        // da mensagem de bloqueio, e o botão não voltava para "ditar".
        setActive(false);
      }
      // Erros transitórios (`no-speech`, `network`, `aborted`) não viram texto
      // na tela: `onend` vem logo depois e a sessão religa sozinha.
    };

    recognition.onend = () => {
      if (!isCurrent()) return;
      // Fecha o trecho desta sessão antes de qualquer religamento.
      committedRef.current = joinTranscript(committedRef.current, liveRef.current);
      liveRef.current = '';

      const keep = shouldKeepListening({
        requestedStop: !listeningRef.current,
        fatalError: fatalRef.current,
        elapsedMs: Date.now() - startedAtRef.current,
      });
      if (keep) {
        try {
          recognition.start();
          return;
        } catch {
          // Religamento recusado pelo navegador: encerra como fim normal.
        }
      }
      if (listeningRef.current && !fatalRef.current) {
        setError('O ditado foi encerrado após dois minutos. Toque no microfone para continuar.');
      }
      listeningRef.current = false;
      setActive(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      listeningRef.current = false;
      setActive(false);
      setError('O reconhecimento de voz não pôde ser iniciado.');
    }
  };

  const start = () => {
    if (!supported || active) return;
    generationRef.current += 1;
    setError('');
    fatalRef.current = false;
    listeningRef.current = true;
    startedAtRef.current = Date.now();
    setActive(true);
    openSession();
  };

  useEffect(() => () => {
    listeningRef.current = false;
    generationRef.current += 1;
    recognitionRef.current?.abort();
  }, []);

  return { active, error, maxListeningMs: MAX_LISTENING_MS, reset, start, stop, supported, transcript };
};
