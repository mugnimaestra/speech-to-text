import { TranscriptionResult } from "@/components/SpeechToText/types";

const PROMPT = `Clean up the following transcription into a clear, polished conversation. The goal is to maintain the core meaning, but structure it in a way that makes it sound more natural, fluid, and professional. Remove repetitive phrases, filler words, and awkward pauses. Adjust grammar, sentence structure, and phrasing to make the dialogue easy to follow while keeping the tone conversational. Ensure each speaker's voice is distinct and the flow of the conversation is smooth.`;

export async function transcribeAudio(
  fileOrUrl: File | string
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append("file", fileOrUrl);
  formData.append("prompt", PROMPT);

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
