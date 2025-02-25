import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import axios from "axios";
import {
  ALLOWED_FORMATS,
  FILE_LIMITS,
  FILE_SIZE_ERROR,
  AllowedFormat,
} from "@/lib/constants";
import { logWithContext } from "@/lib/logger";

const API_URL = "https://api.lemonfox.ai/v1/audio/transcriptions";

// Add runtime config for longer timeout
export const runtime = "nodejs";
export const maxDuration = 3600; // 1 hour in seconds

export async function POST(request: NextRequest) {
  const requestId =
    request.headers.get("x-request-id") ||
    Math.random().toString(36).substring(7);
  let fileOrUrl: File | string | null = null;

  try {
    // Check content length for direct file uploads
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > FILE_LIMITS.MAX_SIZE) {
      logWithContext("warn", "File size exceeds limit", {
        requestId,
        contentLength: parseInt(contentLength),
        maxSize: FILE_LIMITS.MAX_SIZE,
      });
      return NextResponse.json(
        { message: FILE_SIZE_ERROR.OVER_LIMIT },
        { status: 413 } // Payload Too Large
      );
    }

    const formData = await request.formData();
    fileOrUrl = formData.get("file");
    const prompt = formData.get("prompt");

    logWithContext("debug", "Request received", {
      requestId,
      inputType: typeof fileOrUrl,
      isFile: fileOrUrl instanceof File,
      timestamp: new Date().toISOString(),
    });

    if (fileOrUrl instanceof File) {
      logWithContext("debug", "Processing file details", {
        requestId,
        name: fileOrUrl.name,
        type: fileOrUrl.type,
        size: `${(fileOrUrl.size / (1024 * 1024)).toFixed(2)} MB`,
      });
    } else if (typeof fileOrUrl === "string") {
      logWithContext("debug", "Processing URL details", {
        requestId,
        urlLength: fileOrUrl.length,
        urlPreview:
          fileOrUrl.substring(0, 50) + (fileOrUrl.length > 50 ? "..." : ""),
      });
    }

    if (!fileOrUrl) {
      logWithContext("warn", "No file or URL provided", { requestId });
      return NextResponse.json(
        { message: "No file or URL provided" },
        { status: 400 }
      );
    }

    const lemonfoxFormData = new FormData();

    if (typeof fileOrUrl === "string") {
      try {
        new URL(fileOrUrl); // Validate URL format
        lemonfoxFormData.append("file", fileOrUrl);
        logWithContext("debug", "Processing URL input", {
          requestId,
          url: fileOrUrl,
        });
      } catch (error) {
        logWithContext("warn", "Invalid URL provided", {
          requestId,
          url: fileOrUrl,
        });
        return NextResponse.json(
          { message: "Invalid URL provided" },
          { status: 400 }
        );
      }
    } else if (fileOrUrl instanceof File) {
      // Validate file format
      if (!ALLOWED_FORMATS.includes(fileOrUrl.type as AllowedFormat)) {
        logWithContext("warn", "Invalid file format", {
          requestId,
          fileType: fileOrUrl.type,
          allowedFormats: ALLOWED_FORMATS,
        });
        return NextResponse.json(
          { message: FILE_SIZE_ERROR.INVALID_FORMAT(fileOrUrl.type) },
          { status: 400 }
        );
      }

      // Validate file size
      if (fileOrUrl.size > FILE_LIMITS.MAX_SIZE) {
        logWithContext("warn", "File size exceeds limit", {
          requestId,
          fileSize: fileOrUrl.size,
          maxSize: FILE_LIMITS.MAX_SIZE,
        });
        return NextResponse.json(
          { message: FILE_SIZE_ERROR.OVER_LIMIT },
          { status: 413 }
        );
      }

      const buffer = await fileOrUrl.arrayBuffer();
      const fileBlob = new Blob([buffer], { type: fileOrUrl.type });
      lemonfoxFormData.append("file", fileBlob, fileOrUrl.name);

      logWithContext("debug", "Processing file input", {
        requestId,
        fileName: fileOrUrl.name,
        fileType: fileOrUrl.type,
        fileSize: fileOrUrl.size,
      });
    } else {
      logWithContext("warn", "Invalid file input type", {
        requestId,
        inputType: typeof fileOrUrl,
      });
      return NextResponse.json(
        { message: "Invalid file input" },
        { status: 400 }
      );
    }

    // Add Lemonfox-specific parameters
    lemonfoxFormData.append("response_format", "verbose_json");
    lemonfoxFormData.append("speaker_labels", "true");
    if (prompt) {
      lemonfoxFormData.append("prompt", prompt);
      logWithContext("debug", "Added prompt to request", { requestId });
    }

    // Validate API key exists
    const apiKey = process.env.LEMONFOX_API_KEY;
    if (!apiKey) {
      logWithContext("error", "Missing API key configuration", {
        requestId,
      });
      return NextResponse.json(
        { message: "Service configuration error" },
        { status: 500 }
      );
    }

    // Call Lemonfox API
    logWithContext("info", "Calling Lemonfox API", { requestId });
    const startTime = Date.now();

    const response = await axios.post(API_URL, lemonfoxFormData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...lemonfoxFormData.getHeaders(),
      },
      maxBodyLength: FILE_LIMITS.URL_MAX_SIZE,
      timeout: 3600000, // 1 hour timeout
    });

    const duration = Date.now() - startTime;
    logWithContext("info", "Lemonfox API response received", {
      requestId,
      duration,
      status: response.status,
    });

    // Extract text and segments from verbose_json response
    const { text, segments } = response.data;

    // Structure the conversation based on segments
    const structuredConversation = segments.map((segment: any) => ({
      role: segment.speaker,
      text: segment.text,
      timestamp: {
        start: segment.start,
        end: segment.end,
      },
    }));

    logWithContext("info", "Transcription completed successfully", {
      requestId,
      textLength: text.length,
      segmentsCount: segments.length,
      duration,
    });

    return NextResponse.json({ text, segments, structuredConversation });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message;

      logWithContext("error", "Lemonfox API error", {
        requestId,
        statusCode,
        errorMessage,
        url: error.config?.url,
      });

      // Map specific error cases to user-friendly messages
      let message = "Failed to transcribe audio/video";
      switch (statusCode) {
        case 401:
        case 403:
          message = "Service authentication error";
          break;
        case 413:
          message = FILE_SIZE_ERROR.OVER_LIMIT;
          break;
        case 415:
          message = FILE_SIZE_ERROR.INVALID_FORMAT(
            fileOrUrl instanceof File ? fileOrUrl.type : "unknown"
          );
          break;
        case 429:
          message = "Rate limit exceeded. Please try again later";
          break;
      }

      return NextResponse.json(
        { message, details: error.response?.data?.error },
        { status: statusCode }
      );
    }

    logWithContext("error", "Unexpected error during transcription", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
