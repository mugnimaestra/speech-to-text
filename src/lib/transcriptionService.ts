import { TranscriptionResult } from "@/components/SpeechToText/types";

export async function transcribeAudio(
  fileOrUrl: File | string
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append("file", fileOrUrl);

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to transcribe audio");
  }

  const result = await response.json();
  return result;
}
