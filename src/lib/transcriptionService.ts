import { TranscriptionResult } from "@/components/SpeechToText/types";

export type TranscriptionProgressCallback = (
  status: "uploading" | "processing"
) => void;

export async function transcribeAudio(
  fileOrUrl: File | string,
  onProgress?: TranscriptionProgressCallback
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append("file", fileOrUrl);

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
  const maxAttempts = 720; // Poll for up to 1 hour (720 attempts * 5 seconds = 3600 seconds)
  let interval = 2000; // Start with 2 seconds interval

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
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

      // Gradually increase the interval after the first minute
      if (attempt > 30) {
        interval = 10000; // Switch to 10 seconds after first minute
      }

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, interval));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      // Continue polling on error unless it's the last attempt
    }
  }

  throw new Error(
    "Transcription timed out after 1 hour. Please try again or use a shorter audio file."
  );
}
