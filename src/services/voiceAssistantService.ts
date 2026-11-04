import { Platform } from 'react-native';

export type VoiceLanguage = 'en-IN' | 'hi-IN' | 'mr-IN' | 'en-US';

export interface VoiceRecognitionHandlers {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

// Global reference for active web speech recognition instance
let activeRecognition: any = null;

/**
 * Check if the current browser/device environment supports speech recognition
 */
export function isVoiceRecognitionSupported(): boolean {
  if (Platform.OS !== 'web') {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  const win = window as any;
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
}

/**
 * Start speech recognition session with language option
 */
export function startVoiceRecognition(
  language: VoiceLanguage = 'en-IN',
  handlers: VoiceRecognitionHandlers
): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    handlers.onError?.('Voice search is not supported in this environment.');
    return false;
  }

  const win = window as any;
  const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    handlers.onError?.('Speech recognition is not available in your browser.');
    return false;
  }

  // Stop any existing session
  stopVoiceRecognition();

  try {
    const recognition = new SpeechRecognition();
    activeRecognition = recognition;

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      handlers.onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      const text = final || interim;
      if (text.trim()) {
        handlers.onResult?.(text.trim(), !!final);
      }
    };

    recognition.onerror = (event: any) => {
      let errorMsg = 'Voice recognition error';
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone permission denied. Please allow microphone access.';
      } else if (event.error === 'no-speech') {
        errorMsg = 'No speech detected. Please try speaking again.';
      } else if (event.error === 'network') {
        errorMsg = 'Network error during voice recognition.';
      }
      handlers.onError?.(errorMsg);
    };

    recognition.onend = () => {
      activeRecognition = null;
      handlers.onEnd?.();
    };

    recognition.start();
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to start voice recognition';
    handlers.onError?.(msg);
    return false;
  }
}

/**
 * Stop any active speech recognition session
 */
export function stopVoiceRecognition(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {
      // ignore
    }
    activeRecognition = null;
  }
}
