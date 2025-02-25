import { TranscriptionResult } from "@/components/SpeechToText/types";
import { logWithContext } from "./logger";

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
  const requestId = Math.random().toString(36).substring(7);

  // Start the transcription
  onProgress?.("uploading");

  logWithContext("info", "Starting audio transcription", {
    requestId,
    hasFile: formData.has("file"),
    hasPrompt: formData.has("prompt"),
  });

  try {
    logWithContext("debug", "Initiating API request", { requestId });

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      logWithContext("error", "Transcription API error", {
        requestId,
        status: response.status,
        error: error.message,
      });
      throw new Error(error.message || "Failed to transcribe audio");
    }

    const result = await response.json();

    // If we got a resultId, it means we need to poll for results
    if (result.resultId) {
      logWithContext("info", "Received task ID, starting polling", {
        requestId,
        resultId: result.resultId,
      });
      onProgress?.("processing");
      return await pollForResults(result.resultId, requestId);
    }

    logWithContext("info", "Transcription completed successfully", {
      requestId,
    });

    return result;
  } catch (error) {
    logWithContext("error", "Failed to transcribe audio", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function pollForResults(
  resultId: string,
  requestId: string
): Promise<TranscriptionResult> {
  let attempts = 0;
  let currentInterval = POLLING_CONFIG.INITIAL_INTERVAL as number;
  const startTime = Date.now();

  logWithContext("debug", "Starting polling for results", {
    requestId,
    resultId,
    initialInterval: currentInterval,
  });

  while (attempts < POLLING_CONFIG.MAX_ATTEMPTS) {
    attempts++;

    try {
      await new Promise((resolve) => setTimeout(resolve, currentInterval));

      logWithContext("debug", "Polling for results", {
        requestId,
        resultId,
        attempt: attempts,
        elapsedTime: Date.now() - startTime,
      });

      const response = await fetch(`/api/transcription-status/${resultId}`);

      if (response.ok) {
        const result = await response.json();
        logWithContext("info", "Transcription results received", {
          requestId,
          resultId,
          attempts,
          elapsedTime: Date.now() - startTime,
        });
        return result;
      }

      // Handle 404 - still processing
      if (response.status === 404) {
        // Increase polling interval after threshold
        if (
          attempts > POLLING_CONFIG.INTERVAL_INCREASE_AFTER &&
          currentInterval < POLLING_CONFIG.MAX_INTERVAL
        ) {
          currentInterval = Math.min(
            currentInterval * 1.5,
            POLLING_CONFIG.MAX_INTERVAL
          );
          logWithContext("debug", "Increasing polling interval", {
            requestId,
            resultId,
            newInterval: currentInterval,
          });
        }
        continue;
      }

      // Handle other errors
      let error;
      try {
        error = await response.json();
      } catch (e) {
        error = {
          message: `Status ${response.status}: ${response.statusText}`,
        };
      }

      logWithContext("error", "Polling error", {
        requestId,
        resultId,
        status: response.status,
        error: error.message,
      });

      throw new Error(error.message || "Failed to retrieve transcription");
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.message.includes("Failed to retrieve transcription")
        )
      ) {
        logWithContext("error", "Error during polling", {
          requestId,
          resultId,
          attempt: attempts,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Check if we've exceeded the maximum duration
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > POLLING_CONFIG.MAX_DURATION) {
        logWithContext("error", "Polling timeout", {
          requestId,
          resultId,
          elapsedTime,
          maxDuration: POLLING_CONFIG.MAX_DURATION,
        });
        throw new Error("Transcription timed out. Please try again.");
      }

      // Retry on network errors
      if (error instanceof Error && error.message.includes("fetch")) {
        continue;
      }

      throw error;
    }
  }

  logWithContext("error", "Maximum polling attempts reached", {
    requestId,
    resultId,
    attempts: POLLING_CONFIG.MAX_ATTEMPTS,
  });

  throw new Error("Maximum polling attempts reached. Please try again later.");
}
