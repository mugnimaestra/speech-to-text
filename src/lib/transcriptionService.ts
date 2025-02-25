import { TranscriptionResult } from "@/components/SpeechToText/types";
import logger, { logWithContext } from "./logger";

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

  logWithContext('info', 'Starting audio transcription', {
    requestId,
    hasFile: formData.has('file'),
    hasPrompt: formData.has('prompt'),
  });

  try {
    logWithContext('debug', 'Initiating API request', { requestId });
    
    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      logWithContext('error', 'Transcription API error', {
        requestId,
        status: response.status,
        error: error.message,
      });
      throw new Error(error.message || "Failed to transcribe audio");
    }

    const result = await response.json();
    
    // If we got a resultId, it means we need to poll for results
    if (result.resultId) {
      logWithContext('info', 'Received task ID, starting polling', {
        requestId,
        resultId: result.resultId,
      });
      onProgress?.("processing");
      return await pollForResults(result.resultId, requestId);
    }

    logWithContext('info', 'Transcription completed successfully', {
      requestId,
      textLength: result.text?.length,
      segmentsCount: result.segments?.length,
    });

    return result;
  } catch (error) {
    logWithContext('error', 'Transcription failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function pollForResults(resultId: string, requestId: string): Promise<TranscriptionResult> {
  const startTime = Date.now();
  let interval: number = POLLING_CONFIG.INITIAL_INTERVAL;
  let attempts = 0;

  logWithContext('debug', 'Starting polling process', {
    requestId,
    resultId,
    initialInterval: interval,
    maxAttempts: POLLING_CONFIG.MAX_ATTEMPTS,
  });

  while (attempts < POLLING_CONFIG.MAX_ATTEMPTS) {
    try {
      logWithContext('debug', 'Polling attempt', {
        requestId,
        resultId,
        attempt: attempts + 1,
        totalAttempts: POLLING_CONFIG.MAX_ATTEMPTS,
        interval,
      });

      const response = await fetch(`/api/transcription-status/${resultId}`);

      if (response.ok) {
        const result = await response.json();
        logWithContext('info', 'Polling completed successfully', {
          requestId,
          resultId,
          attempts,
          duration: Date.now() - startTime,
        });
        return result;
      }

      if (response.status !== 404) {
        // If we get any error other than 404 (not found), throw it
        let error;
        try {
          error = await response.json();
        } catch (e) {
          error = { message: `Status ${response.status}: ${response.statusText}` };
        }
        
        logWithContext('error', 'Polling error', {
          requestId,
          resultId,
          status: response.status,
          error: error.message,
        });
        
        throw new Error(error.message || "Failed to retrieve transcription");
      }

      // Check if we've exceeded the maximum duration
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > POLLING_CONFIG.MAX_DURATION) {
        logWithContext('error', 'Polling timeout', {
          requestId,
          resultId,
          elapsedTime,
          maxDuration: POLLING_CONFIG.MAX_DURATION,
        });
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
      logWithContext('error', 'Polling attempt failed', {
        requestId,
        resultId,
        attempt: attempts + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      if (attempts === POLLING_CONFIG.MAX_ATTEMPTS - 1) {
        throw error;
      }
      // Continue polling on error unless it's the last attempt
    }
  }

  logWithContext('error', 'Maximum polling attempts reached', {
    requestId,
    resultId,
    attempts: POLLING_CONFIG.MAX_ATTEMPTS,
    duration: Date.now() - startTime,
  });

  throw new Error(
    "Transcription timed out after 1 hour. Please try again or use a shorter audio file."
  );
}
