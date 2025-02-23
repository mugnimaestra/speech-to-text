import { useState, useCallback, useEffect } from "react";
import {
  TranscriptionResult,
  TranscriptionStatus,
} from "@/components/SpeechToText/types";
import { transcribeAudio } from "@/lib/transcriptionService";

// Import polling configuration from transcriptionService
const POLLING_INTERVAL = 2000; // Match initial interval from transcriptionService
const MAX_POLLING_INTERVAL = 10000; // Maximum polling interval

interface TranscriptionResponse extends TranscriptionResult {
  resultId?: string;
}

interface UseSpeechToTextInput {
  type: "file" | "url";
  data: File | string;
}

interface UseSpeechToTextState {
  /** Current input file or URL being processed */
  input: UseSpeechToTextInput | null;
  /** Current status of the transcription process */
  status: TranscriptionStatus;
  /** The transcription result or error */
  transcription: TranscriptionResult | null;
  /** Start time of the processing, used to show duration */
  processingStartTime: Date | null;
  /** ID for polling transcription status */
  transcriptionId: string | null;
}

interface UseSpeechToTextCallbacks {
  /** Callback when transcription is successfully completed */
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  /** Callback when an error occurs during transcription */
  onError?: (error: string) => void;
  /** Selected language for transcription */
  language?: string;
  /** Minimum number of speakers expected in the audio */
  minSpeakers?: number;
  /** Maximum number of speakers expected in the audio */
  maxSpeakers?: number;
}

interface UseSpeechToTextReturn
  extends Omit<UseSpeechToTextState, "processingStartTime"> {
  /** Handle file input for transcription */
  handleFile: (file: File) => Promise<void>;
  /** Handle URL input for transcription */
  handleUrl: (url: string) => Promise<void>;
  /** Handle general errors */
  handleError: (error: string) => void;
  /** Get the current processing time in a human-readable format */
  getProcessingTime: () => string;
  /** Whether there's an active transcription that should prevent tab closing */
  isActiveTranscription: boolean;
  transcriptionId: string | null;
}

/**
 * A custom hook that manages the speech-to-text transcription process.
 *
 * This hook handles:
 * - File and URL input processing
 * - Transcription status management
 * - Error handling
 * - Processing time tracking
 * - Tab close protection
 *
 * The transcription process goes through several states:
 * 1. idle: Initial state
 * 2. uploading: File/URL is being uploaded
 * 3. processing: Audio is being transcribed
 * 4. completed: Transcription is finished
 * 5. error: An error occurred
 *
 * @example
 * ```tsx
 * function TranscriptionComponent() {
 *   const {
 *     status,
 *     transcription,
 *     handleFile,
 *     handleUrl,
 *     getProcessingTime
 *   } = useSpeechToText({
 *     onTranscriptionComplete: (result) => console.log(result),
 *     onError: (error) => console.error(error)
 *   });
 *
 *   return (
 *     <div>
 *       <input
 *         type="file"
 *         onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
 *       />
 *       {status === 'processing' && (
 *         <p>Processing time: {getProcessingTime()}</p>
 *       )}
 *       {transcription && (
 *         <p>{transcription.text}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @param callbacks - Object containing callback functions for transcription completion and errors
 * @returns Object containing transcription state and handler functions
 */
export function useSpeechToText({
  onTranscriptionComplete,
  onError,
  language = "id",
  minSpeakers = 1,
  maxSpeakers = 2,
}: UseSpeechToTextCallbacks = {}): UseSpeechToTextReturn {
  const [state, setState] = useState<UseSpeechToTextState>({
    input: null,
    status: "idle",
    transcription: null,
    processingStartTime: null,
    transcriptionId: null,
  });

  const isActiveTranscription =
    state.status === "uploading" || state.status === "processing";

  // Add beforeunload event handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActiveTranscription) {
        e.preventDefault();
        e.returnValue = "";
        return "You have an active transcription in progress. If you leave, the transcription will be lost. Are you sure you want to leave?";
      }
    };

    if (isActiveTranscription) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [isActiveTranscription]);

  const handleError = useCallback(
    (error: string) => {
      setState((prev) => ({
        ...prev,
        input: null,
        status: "error",
        transcription: { text: "", segments: [], error },
        processingStartTime: null,
        transcriptionId: null,
      }));
      onError?.(error);
    },
    [onError]
  );

  // Add polling effect when we have a transcriptionId
  useEffect(() => {
    if (!state.transcriptionId || state.status !== "processing") return;

    let isSubscribed = true;
    let attempts = 0;
    let currentInterval = POLLING_INTERVAL;

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/transcription-status/${state.transcriptionId}`
        );

        if (!isSubscribed) return;

        if (response.ok) {
          const result = await response.json();
          setState((prev) => ({
            ...prev,
            status: "completed",
            transcription: result,
            processingStartTime: null,
            transcriptionId: null,
          }));
          onTranscriptionComplete?.(result);
          return true; // Signal to stop polling
        } else if (response.status !== 404) {
          // If we get any error other than 404 (not found), handle it
          const error = await response.json();
          throw new Error(error.message);
        }

        // Increase polling interval after first minute (30 attempts)
        attempts++;
        if (attempts > 30 && currentInterval < MAX_POLLING_INTERVAL) {
          currentInterval = Math.min(
            currentInterval * 1.5,
            MAX_POLLING_INTERVAL
          );
        }
        return false; // Continue polling
      } catch (error) {
        if (!isSubscribed) return true;
        handleError((error as Error).message);
        return true; // Stop polling on error
      }
    };

    const pollInterval = setInterval(async () => {
      const shouldStop = await poll();
      if (shouldStop) {
        clearInterval(pollInterval);
      }
    }, currentInterval);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [
    state.transcriptionId,
    state.status,
    onTranscriptionComplete,
    handleError,
  ]);

  const getProcessingTime = useCallback(() => {
    if (!state.processingStartTime) return "";
    const minutes = Math.floor(
      (Date.now() - state.processingStartTime.getTime()) / 60000
    );
    return minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : "";
  }, [state.processingStartTime]);

  const handleFile = useCallback(
    async (file: File) => {
      setState((prev) => ({
        ...prev,
        input: { type: "file", data: file },
        status: "uploading",
        transcription: null,
        processingStartTime: new Date(),
        transcriptionId: null,
      }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", language);
        formData.append("min_speakers", minSpeakers.toString());
        formData.append("max_speakers", maxSpeakers.toString());

        const result = (await transcribeAudio(formData, (status) => {
          setState((prev) => ({ ...prev, status }));
        })) as TranscriptionResponse;

        // If we got a transcriptionId, update state for polling
        if (result.resultId) {
          setState((prev) => ({
            ...prev,
            status: "processing",
            transcriptionId: result.resultId || null,
          }));
          return;
        }

        // If we got immediate results, handle them
        setState((prev) => ({
          ...prev,
          status: "completed",
          transcription: result,
          processingStartTime: null,
        }));
        onTranscriptionComplete?.(result);
      } catch (error) {
        handleError((error as Error).message);
      }
    },
    [onTranscriptionComplete, handleError, language, minSpeakers, maxSpeakers]
  );

  const handleUrl = useCallback(
    async (url: string) => {
      if (!url) {
        handleError("Please enter a URL");
        return;
      }

      try {
        new URL(url); // Validate URL format
      } catch {
        handleError("Please enter a valid URL");
        return;
      }

      setState((prev) => ({
        ...prev,
        input: { type: "url", data: url },
        status: "uploading",
        transcription: null,
        processingStartTime: new Date(),
        transcriptionId: null,
      }));

      try {
        const formData = new FormData();
        formData.append("file", url);
        formData.append("language", language);
        formData.append("min_speakers", minSpeakers.toString());
        formData.append("max_speakers", maxSpeakers.toString());

        const result = (await transcribeAudio(formData, (status) => {
          setState((prev) => ({ ...prev, status }));
        })) as TranscriptionResponse;

        // If we got a transcriptionId, update state for polling
        if (result.resultId) {
          setState((prev) => ({
            ...prev,
            status: "processing",
            transcriptionId: result.resultId || null,
          }));
          return;
        }

        // If we got immediate results, handle them
        setState((prev) => ({
          ...prev,
          status: "completed",
          transcription: result,
          processingStartTime: null,
        }));
        onTranscriptionComplete?.(result);
      } catch (error) {
        handleError((error as Error).message);
      }
    },
    [onTranscriptionComplete, handleError, language, minSpeakers, maxSpeakers]
  );

  return {
    input: state.input,
    status: state.status,
    transcription: state.transcription,
    handleFile,
    handleUrl,
    handleError,
    getProcessingTime,
    isActiveTranscription,
    transcriptionId: state.transcriptionId,
  };
}
