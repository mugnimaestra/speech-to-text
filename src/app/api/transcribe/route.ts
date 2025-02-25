import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import axios from "axios";
import {
  ALLOWED_FORMATS,
  FILE_LIMITS,
  FILE_SIZE_ERROR,
  AllowedFormat,
} from "@/lib/constants";
import { Readable } from "stream";

const API_URL = "https://api.lemonfox.ai/v1/audio/transcriptions";

// Add runtime config for longer timeout
export const runtime = "nodejs";
export const maxDuration = 3600; // 1 hour in seconds

// Debug logger that only logs in development
const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.error(...args);
    }
  },
};

// Helper function to convert File/Blob to Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: NextRequest) {
  try {
    debug.log("=== Starting file upload process ===");

    // Check content length for direct file uploads
    const contentLength = request.headers.get("content-length");
    debug.log("Content length:", contentLength);

    if (contentLength && parseInt(contentLength) > FILE_LIMITS.MAX_SIZE) {
      return NextResponse.json(
        { message: FILE_SIZE_ERROR.OVER_LIMIT },
        { status: 413 } // Payload Too Large
      );
    }

    const formData = await request.formData();
    const fileOrUrl = formData.get("file");
    const prompt = formData.get("prompt");
    debug.log("File or URL type:", typeof fileOrUrl);
    debug.log("Is File instance:", fileOrUrl instanceof File);
    if (fileOrUrl instanceof File) {
      debug.log("File details:", {
        name: fileOrUrl.name,
        type: fileOrUrl.type,
        size: fileOrUrl.size,
      });
    }
    debug.log("Prompt received:", prompt);

    if (!fileOrUrl) {
      return NextResponse.json(
        { message: "No file or URL provided" },
        { status: 400 }
      );
    }

    // Create a new server-side FormData instance
    const lemonfoxFormData = new FormData();
    debug.log("Created new FormData for Lemonfox");

    if (typeof fileOrUrl === "string") {
      debug.log("Processing URL upload");
      try {
        new URL(fileOrUrl); // Validate URL format
        lemonfoxFormData.append("file", fileOrUrl);
        debug.log("URL appended to FormData");
      } catch {
        return NextResponse.json(
          { message: "Invalid URL provided" },
          { status: 400 }
        );
      }
    } else if (fileOrUrl instanceof File) {
      debug.log("Processing File upload");
      // Validate file format
      if (!ALLOWED_FORMATS.includes(fileOrUrl.type as AllowedFormat)) {
        debug.log("Invalid file format:", fileOrUrl.type);
        return NextResponse.json(
          { message: FILE_SIZE_ERROR.INVALID_FORMAT(fileOrUrl.type) },
          { status: 400 }
        );
      }

      // Validate file size
      if (fileOrUrl.size > FILE_LIMITS.MAX_SIZE) {
        debug.log("File too large:", fileOrUrl.size);
        return NextResponse.json(
          { message: FILE_SIZE_ERROR.OVER_LIMIT },
          { status: 413 }
        );
      }

      try {
        debug.log("Converting file to buffer");
        const buffer = await fileToBuffer(fileOrUrl);
        debug.log("Buffer created, size:", buffer.length);

        debug.log("Creating readable stream from buffer");
        const stream = Readable.from(buffer);

        debug.log("Appending file to FormData with metadata");
        lemonfoxFormData.append("file", stream, {
          filename: fileOrUrl.name,
          contentType: fileOrUrl.type,
          knownLength: buffer.length,
        });
        debug.log("File successfully appended to FormData");
      } catch (error) {
        debug.error("Error processing file:", error);
        throw error;
      }
    } else {
      debug.log("Invalid input type received:", typeof fileOrUrl);
      return NextResponse.json(
        { message: "Invalid file input" },
        { status: 400 }
      );
    }

    // Add Lemonfox-specific parameters
    debug.log("Adding Lemonfox-specific parameters");
    lemonfoxFormData.append("response_format", "verbose_json");
    lemonfoxFormData.append("speaker_labels", "true");

    // Get and validate language
    const language = formData.get("language");
    if (language) {
      lemonfoxFormData.append("language", language);
      debug.log("Added language:", language);
    }

    // Get and validate speaker configuration
    const minSpeakers = formData.get("min_speakers");
    const maxSpeakers = formData.get("max_speakers");

    if (minSpeakers) {
      lemonfoxFormData.append("min_speakers", minSpeakers);
      debug.log("Added min_speakers:", minSpeakers);
    }

    if (maxSpeakers) {
      lemonfoxFormData.append("max_speakers", maxSpeakers);
      debug.log("Added max_speakers:", maxSpeakers);
    }

    if (prompt) {
      lemonfoxFormData.append("prompt", prompt);
      debug.log("Added prompt to FormData");
    }

    // Add callback URL only in production environment
    if (process.env.NODE_ENV === "production") {
      const protocol = "https"; // Always use HTTPS in production
      const host = request.headers.get("host") || "";

      // Skip callback for localhost and invalid hosts
      if (!host || host.includes("localhost") || host.includes("127.0.0.1")) {
        debug.log("Skipping callback URL for localhost/invalid host:", host);
      } else {
        const callbackUrl = `${protocol}://${host}/api/transcription-callback`;
        try {
          // Validate the callback URL
          new URL(callbackUrl);
          lemonfoxFormData.append("callback_url", callbackUrl);
          debug.log("Added callback URL:", callbackUrl);
        } catch (error) {
          debug.error("Invalid callback URL format:", callbackUrl);
        }
      }
    } else {
      debug.log("Skipping callback URL in development environment");
    }

    // Validate API key exists
    const apiKey = process.env.LEMONFOX_API_KEY;
    if (!apiKey) {
      debug.error("LEMONFOX_API_KEY is not configured");
      return NextResponse.json(
        { message: "Service configuration error" },
        { status: 500 }
      );
    }

    debug.log("Preparing to make API call to Lemonfox");
    // Call Lemonfox API with the form-data
    const response = await axios.post(API_URL, lemonfoxFormData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...lemonfoxFormData.getHeaders(), // Important for multipart/form-data
      },
      maxBodyLength: FILE_LIMITS.URL_MAX_SIZE,
      timeout: 3600000, // 1 hour timeout
      timeoutErrorMessage:
        "Transcription request timed out. Please try again with a shorter audio file or use the URL method for large files.",
    });
    debug.log("API call successful, processing response");

    // Log the response structure in development mode
    if (process.env.NODE_ENV === "development") {
      // More detailed logging of response structure
      debug.log("Response data structure:", Object.keys(response.data));
      debug.log("Response data type:", typeof response.data);
      debug.log("Response headers:", response.headers);

      // Log a sample of the response data (first 1000 chars if string)
      if (typeof response.data === "string") {
        debug.log(
          "Response data (first 1000 chars):",
          response.data.substring(0, 1000)
        );

        // Try to parse JSON if response is a string
        try {
          const parsedData = JSON.parse(response.data);
          debug.log("Parsed response data keys:", Object.keys(parsedData));
          // Update responseData to use the parsed version
          response.data = parsedData;
        } catch (e) {
          debug.log("Response is not JSON parsable string");
        }
      } else {
        // Log detailed structure recursively up to 2 levels deep
        const safeStringify = (obj: any, depth = 0): string => {
          if (depth > 2) return "[Object]"; // Limit recursion depth
          if (typeof obj !== "object" || obj === null) return String(obj);

          if (Array.isArray(obj)) {
            if (obj.length === 0) return "[]";
            return `[Array(${obj.length}): ${obj
              .slice(0, 3)
              .map((item) => safeStringify(item, depth + 1))
              .join(", ")}${obj.length > 3 ? "..." : ""}]`;
          }

          const keys = Object.keys(obj);
          if (keys.length === 0) return "{}";
          const entries: string[] = keys
            .slice(0, 5)
            .map((key) => `${key}: ${safeStringify(obj[key], depth + 1)}`);
          return `{${entries.join(", ")}${keys.length > 5 ? "..." : ""}}`;
        };

        debug.log("Response data sample:", safeStringify(response.data));
      }
    }

    // Handle different response formats
    const responseData = response.data;
    let text, segments, structuredConversation;

    // Check if we have a text property anywhere in the response
    if (responseData.text !== undefined) {
      // Direct result format
      text = responseData.text;

      // If segments exist, process them
      if (Array.isArray(responseData.segments)) {
        segments = responseData.segments;

        // Structure the conversation based on segments
        structuredConversation = segments.map((segment: any) => ({
          role: segment.speaker || "speaker", // Use default if speaker is missing
          text: segment.text,
          timestamp: {
            start: segment.start,
            end: segment.end,
          },
        }));
      } else {
        // Create a single segment if none provided
        segments = [
          {
            start: 0,
            end: 0,
            text: text,
            speaker: "speaker",
          },
        ];
        structuredConversation = [
          {
            role: "speaker",
            text: text,
            timestamp: { start: 0, end: 0 },
          },
        ];
      }

      return NextResponse.json({
        text,
        segments,
        structuredConversation,
      });
    } else if (responseData.id || responseData.task_id) {
      // This is an async task that we'll need to poll for
      const resultId = responseData.id || responseData.task_id;
      return NextResponse.json({ resultId });
    } else if (typeof responseData === "string") {
      // Try to handle plain text response
      text = responseData;
      segments = [
        {
          id: 0,
          text: responseData,
          start: 0,
          end: 0,
          avg_logprob: -1,
          language: "en",
          speaker: "speaker",
          words: [],
        },
      ];
      structuredConversation = [
        {
          role: "speaker",
          text: responseData,
          timestamp: { start: 0, end: 0 },
        },
      ];

      return NextResponse.json({
        text,
        segments,
        structuredConversation,
      });
    } else {
      // Log entire response for debugging
      debug.error(
        "Unexpected response format:",
        JSON.stringify(response.data, null, 2)
      );
      throw new Error("Unexpected response format from transcription service");
    }
  } catch (error) {
    debug.error("Transcription error:", error);

    if (axios.isAxiosError(error)) {
      // Log the full error response for debugging
      debug.error("API Error Response:", error.response?.data);
      debug.error("API Error Status:", error.response?.status);
      debug.error("API Error Headers:", error.response?.headers);

      const statusCode = error.response?.status || 500;
      let message = "Failed to transcribe audio/video";

      // Use the API's error message if available
      if (error.response?.data?.error?.message) {
        message = error.response.data.error.message;
      }

      // Enhanced error status code logging and handling
      switch (statusCode) {
        case 400:
          debug.error("Bad Request: Invalid parameters or malformed request");
          message = "Invalid request parameters";
          break;
        case 401:
        case 403:
          debug.error("Authentication Error: Invalid or missing API key");
          message = "Service authentication error";
          break;
        case 413:
          debug.error("File Size Error: File exceeds maximum size limit");
          message = FILE_SIZE_ERROR.OVER_LIMIT;
          break;
        case 415:
          debug.error("Unsupported Media Type: Invalid file format");
          message = FILE_SIZE_ERROR.INVALID_FORMAT("unknown format");
          break;
        case 429:
          debug.error("Rate Limit Error: Too many requests");
          message = "Rate limit exceeded. Please try again later";
          break;
        default:
          debug.error(`Unexpected Error Status Code: ${statusCode}`);
      }

      return NextResponse.json(
        {
          message,
          details:
            error.response?.data?.error || "No additional details available",
          status: statusCode,
        },
        { status: statusCode }
      );
    }

    debug.error("Non-Axios error occurred:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        status: 500,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
