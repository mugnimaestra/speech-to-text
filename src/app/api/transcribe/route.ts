import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import axios from "axios";
import {
  ALLOWED_FORMATS,
  FILE_LIMITS,
  FILE_SIZE_ERROR,
  AllowedFormat,
} from "@/lib/constants";

const API_URL = "https://api.lemonfox.ai/v1/audio/transcriptions";

// Add runtime config for longer timeout
export const runtime = "nodejs";
export const maxDuration = 900; // 15 minutes in seconds

export async function POST(request: NextRequest) {
  try {
    // Check content length for direct file uploads
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > FILE_LIMITS.MAX_SIZE) {
      return NextResponse.json(
        { message: FILE_SIZE_ERROR.OVER_LIMIT },
        { status: 413 } // Payload Too Large
      );
    }

    const formData = await request.formData();
    const fileOrUrl = formData.get("file");
    const prompt = formData.get("prompt");

    if (!fileOrUrl) {
      return NextResponse.json(
        { message: "No file or URL provided" },
        { status: 400 }
      );
    }

    // Prepare form data for Lemonfox API
    const lemonfoxFormData = new FormData();

    if (typeof fileOrUrl === "string") {
      // Handle URL case
      try {
        new URL(fileOrUrl); // Validate URL format
        lemonfoxFormData.append("file", fileOrUrl);
      } catch {
        return NextResponse.json(
          { message: "Invalid URL provided" },
          { status: 400 }
        );
      }
    } else if (fileOrUrl instanceof File) {
      // Handle File case
      // Validate file format
      if (!ALLOWED_FORMATS.includes(fileOrUrl.type as AllowedFormat)) {
        return NextResponse.json(
          { message: FILE_SIZE_ERROR.INVALID_FORMAT },
          { status: 400 }
        );
      }

      // Validate file size
      if (fileOrUrl.size > FILE_LIMITS.MAX_SIZE) {
        return NextResponse.json(
          { message: FILE_SIZE_ERROR.OVER_LIMIT },
          { status: 413 }
        );
      }

      const buffer = await fileOrUrl.arrayBuffer();
      const fileBlob = new Blob([buffer], { type: fileOrUrl.type });
      lemonfoxFormData.append("file", fileBlob, fileOrUrl.name);
    } else {
      return NextResponse.json(
        { message: "Invalid file input" },
        { status: 400 }
      );
    }

    // Add Lemonfox-specific parameters for speaker diarization and prompt
    lemonfoxFormData.append("response_format", "verbose_json");
    lemonfoxFormData.append("speaker_labels", "true");
    if (prompt) {
      lemonfoxFormData.append("prompt", prompt);
    }

    // Optional: Add min/max speakers if needed
    // lemonfoxFormData.append('min_speakers', '2');
    // lemonfoxFormData.append('max_speakers', '4');

    // Validate API key exists
    const apiKey = process.env.LEMONFOX_API_KEY;
    if (!apiKey) {
      console.error("LEMONFOX_API_KEY is not configured");
      return NextResponse.json(
        { message: "Service configuration error" },
        { status: 500 }
      );
    }

    // Call Lemonfox API
    const response = await axios.post(API_URL, lemonfoxFormData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...lemonfoxFormData.getHeaders(),
      },
      maxBodyLength: FILE_LIMITS.URL_MAX_SIZE,
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

    return NextResponse.json({ text, segments, structuredConversation });
  } catch (error) {
    console.error("Transcription error:", error);

    if (axios.isAxiosError(error)) {
      // Sanitize error messages
      const statusCode = error.response?.status || 500;
      let message = "Failed to transcribe audio/video";

      // Map specific error cases to user-friendly messages
      if (statusCode === 401 || statusCode === 403) {
        message = "Service authentication error";
      } else if (statusCode === 413) {
        message = FILE_SIZE_ERROR.OVER_LIMIT;
      } else if (statusCode === 415) {
        message = FILE_SIZE_ERROR.INVALID_FORMAT;
      }

      return NextResponse.json({ message }, { status: statusCode });
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
