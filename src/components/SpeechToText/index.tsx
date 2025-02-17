"use client";

import { useState, useCallback, useEffect } from "react";
import {
  SpeechToTextProps,
  TranscriptionResult as TranscriptionResultType,
} from "./types";
import { transcribeAudio } from "@/lib/transcriptionService";
import { URLInput } from "./URLInput";
import { FileDropZone } from "./FileDropZone";
import { TranscriptionResult } from "./TranscriptionResult";

export default function SpeechToText({
  onTranscriptionComplete,
  onError,
}: SpeechToTextProps) {
  const [input, setInput] = useState<{
    type: "file" | "url";
    data: File | string;
  } | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] =
    useState<TranscriptionResultType | null>(null);

  const handleError = useCallback(
    (error: string) => {
      setTranscription({ text: "", segments: [], error });
      onError?.(error);
    },
    [onError]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setInput({ type: "file", data: file });
      setTranscription(null);

      try {
        setIsTranscribing(true);
        const result = await transcribeAudio(file);
        setTranscription(result);
        onTranscriptionComplete?.(result);
      } catch (error) {
        const errorResult: TranscriptionResultType = {
          text: "",
          segments: [],
          error: (error as Error).message,
        };
        setTranscription(errorResult);
        onError?.((error as Error).message);
      } finally {
        setIsTranscribing(false);
      }
    },
    [onTranscriptionComplete, onError]
  );

  const handleUrl = useCallback(
    async (url: string) => {
      if (!url) {
        handleError("Please enter a URL");
        return;
      }

      try {
        new URL(url); // Validate URL format
      } catch {
        handleError("Please enter a valid URL");
        return;
      }

      setInput({ type: "url", data: url });
      setTranscription(null);

      try {
        setIsTranscribing(true);
        const result = await transcribeAudio(url);
        setTranscription(result);
        onTranscriptionComplete?.(result);
      } catch (error) {
        const errorResult: TranscriptionResultType = {
          text: "",
          segments: [],
          error: (error as Error).message,
        };
        setTranscription(errorResult);
        onError?.((error as Error).message);
      } finally {
        setIsTranscribing(false);
      }
    },
    [onTranscriptionComplete, onError, handleError]
  );

  const handleCopyToClipboard = async (): Promise<void> => {
    if (!transcription?.text) return;
    await navigator.clipboard.writeText(transcription.text);
  };

  // Cleanup object URLs when input changes or component unmounts
  useEffect(() => {
    if (input?.type === "file") {
      const file = input.data as File;
      const objectUrl = URL.createObjectURL(file);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [input]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <URLInput onSubmit={handleUrl} isTranscribing={isTranscribing} />

      <FileDropZone
        onFileSelect={handleFile}
        onError={handleError}
        isTranscribing={isTranscribing}
        currentFile={input?.type === "file" ? (input.data as File) : null}
      />

      {transcription && (
        <TranscriptionResult
          text={transcription.text}
          segments={transcription.segments}
          error={transcription.error}
          onCopy={handleCopyToClipboard}
        />
      )}
    </div>
  );
}
