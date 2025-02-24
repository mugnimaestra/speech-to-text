import { useState } from "react";
import { Toast } from "../Toast";
import { Segment, StructuredConversation } from "./types";

type TranscriptionResultProps = {
  text: string;
  segments?: Segment[];
  structuredConversation?: StructuredConversation[];
  error?: string;
  onCopy: (format: "raw" | "verbose") => Promise<void>;
};

export function TranscriptionResult({
  text,
  segments,
  structuredConversation,
  error,
  onCopy,
}: TranscriptionResultProps) {
  const [showToast, setShowToast] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">
          Transcription Result
        </h2>
        <div className="space-x-2">
          <button
            onClick={async () => {
              await onCopy("raw");
              setShowToast(true);
            }}
            className="px-3 py-1.5 rounded text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Copy Raw Text
          </button>
          {segments?.length || structuredConversation?.length ? (
            <button
              onClick={async () => {
                await onCopy("verbose");
                setShowToast(true);
              }}
              className="px-3 py-1.5 rounded text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Copy With Speakers
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="p-4 rounded-lg bg-[#31346e] border border-red-500">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <div className="relative">
          <div
            className={`p-4 rounded-lg bg-[#31346e] border border-[#4c528c] text-white overflow-auto h-80 overflow-y-auto`}
          >
            {structuredConversation ? (
              <div className="space-y-4">
                {structuredConversation.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-24">
                      <span className="inline-block px-2 py-1 bg-indigo-800 text-indigo-200 rounded text-sm font-medium">
                        {item.role}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-gray-200">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : segments ? (
              <div className="space-y-4">
                {segments.map((segment, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-24">
                      <span className="inline-block px-2 py-1 bg-indigo-800 text-indigo-200 rounded text-sm font-medium">
                        {segment.speaker}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-gray-200">{segment.text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {Math.floor(segment.start)}s - {Math.floor(segment.end)}
                        s
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-gray-200">{text}</div>
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
