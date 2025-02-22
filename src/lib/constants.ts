export const ALLOWED_FORMATS = [
  // Audio formats
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/aac",
  "audio/opus",
  "audio/ogg",
  "audio/vorbis",
  "audio/m4a",
  "audio/mpeg",
  "audio/x-m4a",
  "audio/mp4",
  "audio/x-mp4",
  // Video formats
  "video/mp4",
  "video/mpeg",
  "video/mov",
  "video/quicktime",
  "video/webm",
  // Generic formats that might be used
  "application/ogg",
] as const;

export type AllowedFormat = (typeof ALLOWED_FORMATS)[number];

export const FILE_LIMITS = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB for direct uploads
  URL_MAX_SIZE: 1024 * 1024 * 1024, // 1GB for URL-based uploads (according to Lemonfox docs)
} as const;

export const FILE_SIZE_ERROR = {
  OVER_LIMIT:
    "File size exceeds 100MB. Please use URL upload for larger files.",
  OVER_URL_LIMIT: "File size exceeds 1GB limit.",
  INVALID_FORMAT: (detectedType: string) =>
    `Invalid file format: "${detectedType}". Allowed formats: ${ALLOWED_FORMATS.join(
      ", "
    )}`,
} as const;
