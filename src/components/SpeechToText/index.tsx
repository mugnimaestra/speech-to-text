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
  const [translateToEnglish, setTranslateToEnglish] = useState(false);

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
    translate: translateToEnglish,
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
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6 bg-[#151A28] rounded-xl shadow-lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <LanguageSelector onLanguageChange={setSelectedLanguage} />
            {translateToEnglish && (
              <p className="mt-1 text-xs text-gray-400 italic">
                Language is used for initial detection, but output will be
                translated to English
              </p>
            )}
          </div>
          <SpeakerConfig onSpeakerConfigChange={handleSpeakerConfigChange} />
        </div>

        <div className="flex items-center p-3 bg-[#1E2538] rounded-lg border border-[#2C3A59]">
          <input
            type="checkbox"
            id="translate-checkbox"
            checked={translateToEnglish}
            onChange={(e) => setTranslateToEnglish(e.target.checked)}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="translate-checkbox"
            className="ml-3 text-gray-200 font-medium"
          >
            Translate to English
          </label>
          <span className="ml-2 text-xs text-gray-400">
            (Automatically translate transcription to English)
          </span>
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
          className="mt-4 text-center text-gray-300"
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
