import { TranscriptionResult } from "@/components/SpeechToText/types";

export type TranscriptionProgressCallback = (
  status: "uploading" | "processing"
) => void;

// Polling configuration
const POLLING_CONFIG = {
  INITIAL_INTERVAL: 2000, // 2 seconds
  MAX_INTERVAL: 10000, // 10 seconds
  INTERVAL_INCREASE_AFTER: 30, // Increase interval after 30 attempts (1 minute)
  MAX_DURATION: 3600000, // 1 hour in milliseconds
  MAX_ATTEMPTS: 720, // Maximum number of polling attempts
} as const;

export async function transcribeAudio(
  formData: FormData,
  onProgress?: TranscriptionProgressCallback
): Promise<TranscriptionResult> {
  // Start the transcription
  onProgress?.("uploading");
  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to transcribe audio");
  }

  const result = await response.json();

  // If we got a resultId, it means we need to poll for results
  if (result.resultId) {
    onProgress?.("processing");
    return await pollForResults(result.resultId);
  }

  return result;
}

async function pollForResults(resultId: string): Promise<TranscriptionResult> {
  const startTime = Date.now();
  let interval: number = POLLING_CONFIG.INITIAL_INTERVAL;
  let attempts = 0;

  while (attempts < POLLING_CONFIG.MAX_ATTEMPTS) {
    try {
      const response = await fetch(`/api/transcription-status/${resultId}`);

      if (response.ok) {
        return await response.json();
      }

      if (response.status !== 404) {
        // If we get any error other than 404 (not found), throw it
        const error = await response.json();
        throw new Error(error.message);
      }

      // Check if we've exceeded the maximum duration
      if (Date.now() - startTime > POLLING_CONFIG.MAX_DURATION) {
        throw new Error(
          "Transcription timed out after 1 hour. Please try again or use a shorter audio file."
        );
      }

      // Gradually increase the interval after the initial period
      if (attempts > POLLING_CONFIG.INTERVAL_INCREASE_AFTER) {
        interval = Math.min(interval * 1.5, POLLING_CONFIG.MAX_INTERVAL);
      }

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    } catch (error) {
      if (attempts === POLLING_CONFIG.MAX_ATTEMPTS - 1) {
        throw error;
      }
      // Continue polling on error unless it's the last attempt
    }
  }

  throw new Error(
    "Transcription timed out after 1 hour. Please try again or use a shorter audio file."
  );
}
