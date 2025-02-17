/**
 * Represents an audio input source that can be either a File object or a URL string.
 * @example
 * // File input from user's local system
 * const fileInput: AudioInput = new File([blob], 'recording.mp3');
 *
 * // URL input from remote source
 * const urlInput: AudioInput = 'https://example.com/audio/recording.mp3';
 */
export type AudioInput = File | string; // string for URL

/**
 * Represents a single word in the transcription with timing and speaker information.
 * @example
 * // Example word object in the transcription
 * const word: Word = {
 *   word: "Hello",
 *   start: 0.5,    // Start time in seconds
 *   end: 0.9,      // End time in seconds
 *   score: 0.98,   // Confidence score (0-1)
 *   speaker: "A"   // Speaker identifier
 * };
 */
export interface Word {
  word: string;
  start: number;
  end: number;
  score: number;
  speaker: string;
}

/**
 * Represents a segment of transcribed speech with metadata.
 * Each segment contains multiple words and is associated with a specific speaker.
 *
 * @example
 * // Example segment in the transcription
 * const segment: Segment = {
 *   id: 1,
 *   text: "Hello, how are you today?",
 *   start: 0.5,
 *   end: 2.3,
 *   avg_logprob: -0.12,      // Average log probability (confidence)
 *   language: "en",          // Detected language
 *   speaker: "A",            // Speaker identifier
 *   words: [                 // Detailed word-level information
 *         {
 *           word: "Hello",
 *           start: 0.5,
 *           end: 0.9,
 *           score: 0.98,
 *           speaker: "A"
 *         },
 *         {
 *           word: "how",
 *           start: 1.0,
 *           end: 1.2,
 *           score: 0.95,
 *           speaker: "A"
 *         },
 *         {
 *           word: "are",
 *           start: 1.3,
 *           end: 1.5,
 *           score: 0.97,
 *           speaker: "A"
 *         },
 *         {
 *           word: "you",
 *           start: 1.6,
 *           end: 1.8,
 *           score: 0.96,
 *           speaker: "A"
 *         },
 *         {
 *           word: "today",
 *           start: 1.9,
 *           end: 2.3,
 *           score: 0.94,
 *           speaker: "A"
 *         }
 *       ]
 *     },
 *     // ... more words
 *   ]
 * };
 *
 * UI Visualization:
 * +----------------------------------+
 * | Speaker A                    0:00 |
 * | Hello, how are you today?         |
 * |                                   |
 * | Speaker B                    0:02 |
 * | I'm doing great, thank you!       |
 * +----------------------------------+
 */
export interface Segment {
  id: number;
  text: string;
  start: number;
  end: number;
  avg_logprob: number;
  language: string;
  speaker: string;
  words: Word[];
}

/**
 * Represents a structured conversation format for the transcription
 */
export interface StructuredConversation {
  role: string;
  text: string;
  timestamp?: {
    start: number;
    end: number;
  };
}

/**
 * Represents the complete transcription result with all segments and potential error information.
 *
 * @example
 * // Example transcription result
 * const result: TranscriptionResult = {
 *   text: "Hello, how are you today? I'm doing great, thank you!",
 *   segments: [
 *     {
 *       id: 1,
 *       text: "Hello, how are you today?",
 *       start: 0.5,
 *       end: 2.3,
 *       avg_logprob: -0.12,
 *       language: "en",
 *       speaker: "A",
 *       words: [
 *         {
 *           word: "Hello",
 *           start: 0.5,
 *           end: 0.9,
 *           score: 0.98,
 *           speaker: "A"
 *         },
 *         {
 *           word: "how",
 *           start: 1.0,
 *           end: 1.2,
 *           score: 0.95,
 *           speaker: "A"
 *         },
 *         {
 *           word: "are",
 *           start: 1.3,
 *           end: 1.5,
 *           score: 0.97,
 *           speaker: "A"
 *         },
 *         {
 *           word: "you",
 *           start: 1.6,
 *           end: 1.8,
 *           score: 0.96,
 *           speaker: "A"
 *         },
 *         {
 *           word: "today",
 *           start: 1.9,
 *           end: 2.3,
 *           score: 0.94,
 *           speaker: "A"
 *         }
 *       ]
 *     },
 *     {
 *       id: 2,
 *       text: "I'm doing great, thank you!",
 *       start: 2.5,
 *       end: 4.2,
 *       avg_logprob: -0.08,
 *       language: "en",
 *       speaker: "B",
 *       words: [
 *         {
 *           word: "I'm",
 *           start: 2.5,
 *           end: 2.7,
 *           score: 0.96,
 *           speaker: "B"
 *         },
 *         {
 *           word: "doing",
 *           start: 2.8,
 *           end: 3.1,
 *           score: 0.97,
 *           speaker: "B"
 *         },
 *         {
 *           word: "great",
 *           start: 3.2,
 *           end: 3.5,
 *           score: 0.98,
 *           speaker: "B"
 *         },
 *         {
 *           word: "thank",
 *           start: 3.6,
 *           end: 3.8,
 *           score: 0.95,
 *           speaker: "B"
 *         },
 *         {
 *           word: "you",
 *           start: 3.9,
 *           end: 4.2,
 *           score: 0.96,
 *           speaker: "B"
 *         }
 *       ]
 *     }
 *   ]
 * };
 */
export interface TranscriptionResult {
  text: string;
  segments: Segment[];
  error?: string;
  structuredConversation?: StructuredConversation[];
}

/**
 * Props for the SpeechToText component that handles audio transcription.
 *
 * @example
 * // Example usage in a React component
 * <SpeechToText
 *   onTranscriptionComplete={(result) => {
 *     console.log('Full transcription:', result.text);
 *     result.segments.forEach(segment => {
 *       console.log(`Speaker ${segment.speaker}: ${segment.text}`);
 *     });
 *   }}
 *   onError={(error) => {
 *     console.error('Transcription error:', error);
 *   }}
 * />
 */
export interface SpeechToTextProps {
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
}
