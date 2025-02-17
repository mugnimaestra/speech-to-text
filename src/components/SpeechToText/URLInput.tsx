import { useState } from "react";

interface URLInputProps {
  onSubmit: (url: string) => Promise<void>;
  isTranscribing: boolean;
}

export function URLInput({ onSubmit, isTranscribing }: URLInputProps) {
  const [urlInput, setUrlInput] = useState("");
  const inputId = "url-input";
  const buttonId = "submit-url";

  const handleSubmit = () => {
    onSubmit(urlInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2" role="group" aria-labelledby={buttonId}>
      <input
        id={inputId}
        type="text"
        placeholder="Enter media URL (optional)"
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
        aria-label="Media URL input"
      />
      <button
        id={buttonId}
        onClick={handleSubmit}
        disabled={isTranscribing}
        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        aria-busy={isTranscribing}
      >
        {isTranscribing ? "Transcribing..." : "Transcribe URL"}
      </button>
    </div>
  );
}
