"use client";

import { SpeechToTextProps, TRANSCRIPTION_STATUS_MESSAGES } from "./types";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { URLInput } from "./URLInput";
import { FileDropZone } from "./FileDropZone";
import { TranscriptionResult } from "./TranscriptionResult";
import LanguageSelector from "../LanguageSelector";
import { useState } from "react";

export default function SpeechToText({
  onTranscriptionComplete,
  onError,
}: SpeechToTextProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("id");
  const {
    input,
    status: transcriptionStatus,
    transcription,
    handleFile,
    handleUrl,
    handleError,
    getProcessingTime,
  } = useSpeechToText({
    onTranscriptionComplete,
    onError,
    language: selectedLanguage,
  });

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-6">
        <LanguageSelector onLanguageChange={setSelectedLanguage} />

        <URLInput
          onSubmit={handleUrl}
          isTranscribing={
            transcriptionStatus === "uploading" ||
            transcriptionStatus === "processing"
          }
        />

        <FileDropZone
          onFileSelect={handleFile}
          onError={handleError}
          isTranscribing={
            transcriptionStatus === "uploading" ||
            transcriptionStatus === "processing"
          }
          currentFile={input?.type === "file" ? (input.data as File) : null}
        />
      </div>

      {transcriptionStatus !== "idle" && (
        <div
          className="mt-4 text-center text-gray-600"
          role="status"
          aria-live="polite"
        >
          <p>
            {TRANSCRIPTION_STATUS_MESSAGES[transcriptionStatus]}
            {transcriptionStatus === "processing" && (
              <span className="text-sm ml-2">({getProcessingTime()})</span>
            )}
          </p>
        </div>
      )}

      {transcription && (
        <TranscriptionResult
          text={transcription.text}
          segments={transcription.segments}
          structuredConversation={transcription.structuredConversation}
          onCopy={async (format) => {
            try {
              await navigator.clipboard.writeText(
                format === "raw"
                  ? transcription.text
                  : JSON.stringify(transcription, null, 2)
              );
            } catch (error) {
              handleError("Failed to copy to clipboard");
            }
          }}
        />
      )}
    </div>
  );
}
