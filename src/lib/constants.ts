export const ALLOWED_FORMATS = [
  'audio/mp3',
  'audio/wav',
  'audio/flac',
  'audio/aac',
  'audio/opus',
  'audio/ogg',
  'audio/m4a',
  'video/mp4',
  'video/mpeg',
  'video/mov',
  'video/webm',
] as const;

export type AllowedFormat = typeof ALLOWED_FORMATS[number];

export const FILE_LIMITS = {
  VERCEL_MAX_SIZE: 4 * 1024 * 1024, // 4MB for direct file uploads through Vercel
  URL_MAX_SIZE: 1024 * 1024 * 1024, // 1GB for URL-based uploads (according to Lemonfox docs)
} as const;

export const FILE_SIZE_ERROR = {
  OVER_VERCEL_LIMIT: 'File size exceeds 4MB. Please use URL upload for larger files.',
  OVER_URL_LIMIT: 'File size exceeds 1GB limit.',
  INVALID_FORMAT: `Invalid file format. Allowed formats: ${ALLOWED_FORMATS.join(', ')}`,
} as const;