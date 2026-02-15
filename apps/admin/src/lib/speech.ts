"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  language?: string;
  continuous?: boolean;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

/**
 * Hook wrapping the Web Speech API for voice capture.
 * Provides interim and final transcripts, and handles browser compatibility.
 */
export function useSpeechRecognition({
  onResult,
  onError,
  language = "en-AU",
  continuous = true,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported] = useState(() => Boolean(getSpeechRecognitionCtor()));
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionCtor();

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const current = finalTranscript || interimTranscript;
        setTranscript(current);

        if (finalTranscript) {
          onResult?.(finalTranscript, true);
        } else if (interimTranscript) {
          onResult?.(interimTranscript, false);
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== "no-speech") {
          onError?.(event.error);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, [language, continuous, onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // Already started -- ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
  };
}
