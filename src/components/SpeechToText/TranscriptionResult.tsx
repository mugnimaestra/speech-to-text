import { useState } from "react";
import { Toast } from "../Toast";
import { Segment, StructuredConversation } from "./types";

type TranscriptionResultProps = {
  text: string;
  segments?: Segment[];
  structuredConversation?: StructuredConversation[];
  error?: string;
  onCopy: () => Promise<void>;
};

export function TranscriptionResult({
  text,
  segments,
  structuredConversation,
  error,
  onCopy,
}: TranscriptionResultProps) {
  const [showToast, setShowToast] = useState(false);

  const handleCopy = async () => {
    try {
      await onCopy();
      setShowToast(true);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <div className="mt-8">
      {error ? (
        <div className="text-rose-500">❌ {error}</div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3
              className="text-lg font-medium text-emerald-700"
              id="transcription-heading"
            >
              <span aria-hidden="true">📝</span> Transcription
            </h3>
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              aria-label="Copy transcription to clipboard"
            >
              <span aria-hidden="true">📋</span> Copy to Clipboard
            </button>
          </div>
          <div
            className="p-4 bg-emerald-50 rounded-lg border border-emerald-100"
            aria-labelledby="transcription-heading"
          >
            {structuredConversation ? (
              <div className="space-y-4">
                {structuredConversation.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-24">
                      <span className="inline-block px-2 py-1 bg-emerald-100 rounded text-sm font-medium text-emerald-800">
                        {item.role}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-gray-800">{item.text}</p>
                      {item.timestamp && (
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.floor(item.timestamp.start)}s -{" "}
                          {Math.floor(item.timestamp.end)}s
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : segments ? (
              <div className="space-y-4">
                {segments.map((segment, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-24">
                      <span className="inline-block px-2 py-1 bg-emerald-100 rounded text-sm font-medium text-emerald-800">
                        {segment.speaker}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-gray-800">{segment.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.floor(segment.start)}s - {Math.floor(segment.end)}
                        s
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{text}</div>
            )}
          </div>
        </div>
      )}
      {showToast && (
        <Toast
          message="Transcription copied to clipboard!"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
