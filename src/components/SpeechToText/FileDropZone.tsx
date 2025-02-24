import { useCallback, useMemo, useRef, useState } from "react";
import { ALLOWED_FORMATS, FILE_LIMITS, FILE_SIZE_ERROR } from "@/lib/constants";

// Helper function to convert bytes to MB
const bytesToMB = (bytes: number): number => {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
};

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  onError: (message: string) => void;
  isTranscribing: boolean;
  currentFile: File | null;
}

interface FormatGroups {
  audio: string[];
  video: string[];
}

function isAllowedMimeType(
  mimeType: string
): mimeType is (typeof ALLOWED_FORMATS)[number] {
  return ALLOWED_FORMATS.includes(mimeType as (typeof ALLOWED_FORMATS)[number]);
}

export function FileDropZone({
  onFileSelect,
  onError,
  isTranscribing,
  currentFile,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      if (!isAllowedMimeType(file.type)) {
        onError(FILE_SIZE_ERROR.INVALID_FORMAT(file.type || "unknown"));
        return false;
      }

      if (file.size > FILE_LIMITS.MAX_SIZE) {
        onError(FILE_SIZE_ERROR.OVER_LIMIT);
        return false;
      }

      return true;
    },
    [onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect, validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect, validateFile]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatGroups: FormatGroups = useMemo(
    () => ({
      audio: ALLOWED_FORMATS.filter((f) => f.startsWith("audio/")).map((f) =>
        f.replace("audio/", "")
      ),
      video: ALLOWED_FORMATS.filter((f) => f.startsWith("video/")).map((f) =>
        f.replace("video/", "")
      ),
    }),
    []
  );

  const getObjectURL = useCallback(
    (file: File) => URL.createObjectURL(file),
    []
  );

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label={
          currentFile
            ? "Selected media file preview"
            : "Drop zone for audio or video files"
        }
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragging
              ? "border-indigo-400 bg-[#363f6a]"
              : "border-[#4c528c] hover:border-indigo-400"
          }
          ${isTranscribing ? "pointer-events-none opacity-50" : ""}
          focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#2a365e]`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-busy={isTranscribing}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={ALLOWED_FORMATS.join(",")}
          onChange={handleFileInput}
          aria-hidden="true"
        />

        {isTranscribing ? (
          <div className="flex flex-col items-center space-y-2" role="status">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"
              aria-hidden="true"
            ></div>
            <p className="text-gray-200">
              <span aria-hidden="true">🎵</span>
              Transcribing media...
            </p>
            <div className="sr-only">
              Processing media file for transcription
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-gray-200">
              {currentFile ? (
                <>
                  <p className="font-medium" id="selected-file">
                    {currentFile.name}
                  </p>
                  {currentFile.type.startsWith("audio/") ? (
                    <audio
                      controls
                      src={getObjectURL(currentFile)}
                      className="mt-4"
                      aria-label={`Audio preview for ${currentFile.name}`}
                    />
                  ) : (
                    <video
                      controls
                      src={getObjectURL(currentFile)}
                      className="mt-4 max-w-full"
                      aria-label={`Video preview for ${currentFile.name}`}
                    />
                  )}
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <svg
                      className="mx-auto h-12 w-12 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-1">
                    Drop your audio or video file here
                  </p>
                  <p>or click to browse</p>
                  <p className="mt-2 text-sm text-gray-300">
                    Supported formats: {formatGroups.audio.join(", ")},{" "}
                    {formatGroups.video.join(", ")}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Max size: {bytesToMB(FILE_LIMITS.MAX_SIZE)} MB
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
