import { useCallback, useMemo, useRef, useState } from "react";
import { ALLOWED_FORMATS, FILE_LIMITS, FILE_SIZE_ERROR } from "@/lib/constants";

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
        onError(FILE_SIZE_ERROR.INVALID_FORMAT);
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
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${isTranscribing ? "pointer-events-none opacity-50" : ""}
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
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
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"
              aria-hidden="true"
            ></div>
            <p className="text-gray-600">
              <span aria-hidden="true">🎵</span>
              Transcribing media...
            </p>
            <div className="sr-only">
              Processing media file for transcription
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-gray-600">
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
                  <p
                    className="font-medium text-emerald-700"
                    id="dropzone-instructions"
                  >
                    <span aria-hidden="true">📁</span> Drag and drop a file
                    here, or click to select
                  </p>
                  <div
                    className="text-sm mt-2 space-y-1"
                    role="region"
                    aria-label="File format requirements"
                  >
                    <p>
                      <span aria-hidden="true">🎵</span> Supported audio
                      formats:{" "}
                      <span
                        aria-label={`Supported audio formats: ${formatGroups.audio.join(
                          ", "
                        )}`}
                      >
                        {formatGroups.audio.join(", ").toUpperCase()}
                      </span>
                    </p>
                    <p>
                      <span aria-hidden="true">🎥</span> Supported video
                      formats:{" "}
                      <span
                        aria-label={`Supported video formats: ${formatGroups.video.join(
                          ", "
                        )}`}
                      >
                        {formatGroups.video.join(", ").toUpperCase()}
                      </span>
                    </p>
                    <p>
                      <span aria-hidden="true">📁</span> Size limits: Direct
                      upload up to {FILE_LIMITS.MAX_SIZE / 1024 / 1024}
                      MB. For larger files up to{" "}
                      {FILE_LIMITS.URL_MAX_SIZE / 1024 / 1024}MB, please use URL
                      upload.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
