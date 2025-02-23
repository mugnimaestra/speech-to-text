"use client";

import { SpeechToTextProps, TRANSCRIPTION_STATUS_MESSAGES } from "./types";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { URLInput } from "./URLInput";
import { FileDropZone } from "./FileDropZone";
import { TranscriptionResult } from "./TranscriptionResult";

export default function SpeechToText({
  onTranscriptionComplete,
  onError,
}: SpeechToTextProps) {
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
  });

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
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

      {(transcriptionStatus === "uploading" ||
        transcriptionStatus === "processing") && (
        <div className="mt-4 text-center">
          <div className="flex flex-col items-center space-y-2" role="status">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"
              aria-hidden="true"
            ></div>
            <p className="text-gray-600">
              {TRANSCRIPTION_STATUS_MESSAGES[transcriptionStatus]}
              {transcriptionStatus === "processing" && getProcessingTime()}
            </p>
            {(transcriptionStatus === "uploading" ||
              transcriptionStatus === "processing") && (
              <>
                <p className="text-sm text-gray-500 mt-2">
                  You can leave this page and come back later. We'll keep
                  processing your file.
                </p>
                <p className="text-sm text-amber-600 font-medium">
                  ⚠️ Don't close this tab or your transcription will be lost
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {transcription && (
        <TranscriptionResult
          text={transcription.text}
          segments={transcription.segments}
          structuredConversation={transcription.structuredConversation}
          error={transcription.error}
          onCopy={async (format) => {
            if (!transcription.text) return;

            if (format === "raw") {
              await navigator.clipboard.writeText(transcription.text);
            } else {
              // Format verbose text with speaker information
              let verboseText = "";
              if (transcription.structuredConversation) {
                verboseText = transcription.structuredConversation
                  .map((item) => `[${item.role}] ${item.text}\n`)
                  .join("\n");
              } else if (transcription.segments) {
                verboseText = transcription.segments
                  .map((segment) => `[${segment.speaker}] ${segment.text}\n`)
                  .join("\n");
              }
              await navigator.clipboard.writeText(verboseText);
            }
          }}
        />
      )}
    </div>
  );
}
