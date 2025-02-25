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

  try {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = "Failed to transcribe audio";
      try {
        const error = await response.json();
        console.error("Transcription API error:", error);
        errorMessage = error.message || errorMessage;

        // Additional logging for detailed errors
        if (error.details) {
          console.error("Error details:", error.details);
        }
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(
      "API response received:",
      JSON.stringify(result).substring(0, 200) + "..."
    );

    // If we got a resultId, it means we need to poll for results
    if (result.resultId) {
      console.log("Polling for results with ID:", result.resultId);
      onProgress?.("processing");
      return await pollForResults(result.resultId);
    }

    return result;
  } catch (error) {
    console.error("Transcription request failed:", error);
    throw error;
  }
}

async function pollForResults(resultId: string): Promise<TranscriptionResult> {
  const startTime = Date.now();
  let interval: number = POLLING_CONFIG.INITIAL_INTERVAL;
  let attempts = 0;

  console.log(`Starting polling for result ID: ${resultId}`);

  while (attempts < POLLING_CONFIG.MAX_ATTEMPTS) {
    try {
      console.log(
        `Polling attempt ${attempts + 1}/${POLLING_CONFIG.MAX_ATTEMPTS}`
      );
      const response = await fetch(`/api/transcription-status/${resultId}`);

      if (response.ok) {
        const result = await response.json();
        console.log("Polling successful, received result");
        return result;
      }

      if (response.status !== 404) {
        // If we get any error other than 404 (not found), throw it
        let error;
        try {
          error = await response.json();
        } catch (e) {
          console.error("Error parsing polling response:", e);
          error = {
            message: `Status ${response.status}: ${response.statusText}`,
          };
        }
        console.error(`Polling error (status ${response.status}):`, error);
        throw new Error(error.message || "Failed to retrieve transcription");
      }

      // If we're here, we got a 404 - which means result is not ready yet
      console.log(
        `Result not ready yet (404), waiting ${interval}ms before next attempt`
      );

      // Check if we've exceeded the maximum duration
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > POLLING_CONFIG.MAX_DURATION) {
        console.error(`Polling timed out after ${elapsedTime}ms`);
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
      console.error(`Polling attempt ${attempts + 1} failed:`, error);
      if (attempts === POLLING_CONFIG.MAX_ATTEMPTS - 1) {
        throw error;
      }
      // Continue polling on error unless it's the last attempt
    }
  }

  console.error(
    `Reached maximum polling attempts (${POLLING_CONFIG.MAX_ATTEMPTS})`
  );
  throw new Error(
    "Transcription timed out after 1 hour. Please try again or use a shorter audio file."
  );
}
