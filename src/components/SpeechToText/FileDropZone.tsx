import { ALLOWED_FORMATS, FILE_LIMITS, FILE_SIZE_ERROR } from "@/lib/constants";
import { useCallback, useMemo, useRef, useState } from "react";

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
	mimeType: string,
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
		[onError],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLButtonElement>) => {
			e.preventDefault();
			setIsDragging(false);

			const file = e.dataTransfer.files[0];
			if (file && validateFile(file)) {
				onFileSelect(file);
			}
		},
		[onFileSelect, validateFile],
	);

	const handleDragOver = useCallback(
		(e: React.DragEvent<HTMLButtonElement>) => {
			e.preventDefault();
			setIsDragging(true);
		},
		[],
	);

	const handleDragLeave = useCallback(
		(e: React.DragEvent<HTMLButtonElement>) => {
			e.preventDefault();
			setIsDragging(false);
		},
		[],
	);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file && validateFile(file)) {
				onFileSelect(file);
			}
		},
		[onFileSelect, validateFile],
	);

	const handleClick = () => {
		fileInputRef.current?.click();
	};

	const formatGroups: FormatGroups = useMemo(
		() => ({
			audio: ALLOWED_FORMATS.filter((f) => f.startsWith("audio/")).map((f) =>
				f.replace("audio/", ""),
			),
			video: ALLOWED_FORMATS.filter((f) => f.startsWith("video/")).map((f) =>
				f.replace("video/", ""),
			),
		}),
		[],
	);

	const getObjectURL = useCallback(
		(file: File) => URL.createObjectURL(file),
		[],
	);

	return (
		<div className="space-y-4">
			<button
				type="button"
				aria-label={
					currentFile
						? "Selected media file preview"
						: "Drop zone for audio or video files"
				}
				className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors w-full
          ${
						isDragging
							? "border-gray-500 bg-[#1E2231]"
							: "border-[#2A3045] hover:border-gray-600"
					}
          ${isTranscribing ? "pointer-events-none opacity-50" : ""}
          focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#151A28]`}
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
				/>

				{isTranscribing ? (
					<div className="flex flex-col items-center justify-center h-full min-h-[150px] space-y-2">
						<div
							className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"
							aria-hidden="true"
						/>
						<p className="text-gray-300 text-center">
							<span aria-hidden="true">🎵</span>
							Transcribing media...
						</p>
						<div className="sr-only">
							Processing media file for transcription
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div className="text-gray-300">
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
										>
											<track kind="captions" src="" label="English captions" />
											Your browser does not support the audio element.
										</audio>
									) : (
										<video
											controls
											src={getObjectURL(currentFile)}
											className="mt-4 max-w-full"
											aria-label={`Video preview for ${currentFile.name}`}
										>
											<track kind="captions" src="" label="English captions" />
											Your browser does not support the video element.
										</video>
									)}
								</>
							) : (
								<>
									<div className="mb-4">
										<svg
											className="mx-auto h-12 w-12 text-gray-500"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
											aria-labelledby="uploadIconTitle"
										>
											<title id="uploadIconTitle">Upload file</title>
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
									<p className="mt-2 text-sm text-gray-400">
										Supported formats: {formatGroups.audio.join(", ")},{" "}
										{formatGroups.video.join(", ")}
									</p>
									<p className="text-xs text-gray-400 mt-1">
										Max size: {bytesToMB(FILE_LIMITS.MAX_SIZE)} MB
									</p>
								</>
							)}
						</div>
					</div>
				)}
			</button>
		</div>
	);
}
