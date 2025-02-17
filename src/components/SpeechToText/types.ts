export type AudioInput = File | string; // string for URL

export interface TranscriptionResult {
  text: string;
  error?: string;
}

export interface SpeechToTextProps {
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
}