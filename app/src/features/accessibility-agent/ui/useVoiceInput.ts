import { useEffect, useRef, useState } from 'react';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
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
  const supported = getConstructor() !== null;

  const stop = () => recognitionRef.current?.stop();
  const start = () => {
    const Constructor = getConstructor();
    if (!Constructor || active) return;
    setError('');
    const recognition = new Constructor();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let text = '';
      for (let index = 0; index < event.results.length; index += 1) text += event.results[index][0]?.transcript ?? '';
      setTranscript(text.trim());
    };
    recognition.onerror = () => {
      setError('Não foi possível captar a voz. Verifique a permissão do microfone.');
      setActive(false);
    };
    recognition.onend = () => setActive(false);
    recognitionRef.current = recognition;
    setActive(true);
    try {
      recognition.start();
    } catch {
      setActive(false);
      setError('O reconhecimento de voz não pôde ser iniciado.');
    }
  };

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { active, error, start, stop, supported, transcript, setTranscript };
};
