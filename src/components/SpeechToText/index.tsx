"use client";

import { SpeechToTextProps, TRANSCRIPTION_STATUS_MESSAGES } from "./types";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { URLInput } from "./URLInput";
import { FileDropZone } from "./FileDropZone";
import { TranscriptionResult } from "./TranscriptionResult";
import { SpeakerConfig } from "./SpeakerConfig";
import LanguageSelector from "../LanguageSelector";
import { useState, useCallback } from "react";

export default function SpeechToText({
  onTranscriptionComplete,
  onError,
}: SpeechToTextProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("indonesian");
  const [speakerConfig, setSpeakerConfig] = useState({ min: 1, max: 2 });

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
    minSpeakers: speakerConfig.min,
    maxSpeakers: speakerConfig.max,
  });

  const handleSpeakerConfigChange = (min: number, max: number) => {
    setSpeakerConfig({ min, max });
  };

  const handleCopy = useCallback(
    async (format: "raw" | "verbose") => {
      if (!transcription) return;

      try {
        let textToCopy = transcription.text;
        if (format === "verbose") {
          if (transcription.structuredConversation) {
            textToCopy = transcription.structuredConversation
              .map((item) => `${item.role}: ${item.text}`)
              .join("\n\n");
          } else if (transcription.segments) {
            textToCopy = transcription.segments
              .map((segment) => `${segment.speaker}: ${segment.text}`)
              .join("\n\n");
          }
        }
        await navigator.clipboard.writeText(textToCopy);
      } catch (error) {
        handleError("Failed to copy to clipboard");
      }
    },
    [transcription, handleError]
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6 bg-[#2a365e] rounded-xl shadow-lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LanguageSelector onLanguageChange={setSelectedLanguage} />
          <SpeakerConfig onSpeakerConfigChange={handleSpeakerConfigChange} />
        </div>

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
          className="mt-4 text-center text-gray-200"
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
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}
