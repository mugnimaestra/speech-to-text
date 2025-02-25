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

// Debug logger that logs in all environments
const debug = {
  log: (...args: any[]) => {
    // Always log, regardless of environment
    console.log("[TRANSCRIBE]", ...args);
  },
  error: (...args: any[]) => {
    // Always log errors, regardless of environment
    console.error("[TRANSCRIBE ERROR]", ...args);
  },
  // Add a new method for detailed response logging that works in all environments
  response: (...args: any[]) => {
    console.log("[TRANSCRIBE RESPONSE]", ...args);
  },
};

// Helper function to convert File/Blob to Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: NextRequest) {
  // Initialize fileOrUrl at a higher scope so it's accessible in error handlers
  let fileOrUrl: File | string | null = null;

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
    fileOrUrl = formData.get("file");
    const prompt = formData.get("prompt");
    debug.log("Request details:", {
      input_type: typeof fileOrUrl,
      is_file: fileOrUrl instanceof File,
      timestamp: new Date().toISOString(),
    });

    if (fileOrUrl instanceof File) {
      debug.log("File details:", {
        name: fileOrUrl.name,
        type: fileOrUrl.type,
        size: `${(fileOrUrl.size / (1024 * 1024)).toFixed(2)} MB`,
        timestamp: new Date().toISOString(),
      });
    } else if (typeof fileOrUrl === "string") {
      debug.log("URL details:", {
        url_length: fileOrUrl.length,
        url_preview:
          fileOrUrl.substring(0, 50) + (fileOrUrl.length > 50 ? "..." : ""),
        timestamp: new Date().toISOString(),
      });
    }

    if (prompt) {
      debug.log("Prompt provided:", {
        length:
          typeof prompt === "string" ? prompt.length : prompt.toString().length,
        preview:
          prompt.toString().substring(0, 50) +
          (prompt.toString().length > 50 ? "..." : ""),
      });
    }

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
      debug.log("TRANSCRIPTION: Processing URL upload");
      try {
        new URL(fileOrUrl); // Validate URL format
        debug.log("TRANSCRIPTION: URL validation successful", {
          url: fileOrUrl,
          timestamp: new Date().toISOString(),
        });
        lemonfoxFormData.append("file", fileOrUrl);
        debug.log(
          "TRANSCRIPTION: URL added to form data with parameter name 'file'"
        );

        // Log complete form data for URL submission
        debug.log("TRANSCRIPTION: Complete URL submission details", {
          url: fileOrUrl,
          headers: lemonfoxFormData.getHeaders(),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        debug.error("TRANSCRIPTION ERROR: URL validation failed", {
          attempted_url: fileOrUrl,
          error_message:
            error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
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
    // Add extra logging for URL uploads
    if (typeof fileOrUrl === "string") {
      debug.log("URL TRANSCRIPTION: Making API request:", {
        url_length: fileOrUrl.length,
        api_endpoint: API_URL,
        url_preview:
          fileOrUrl.substring(0, 100) + (fileOrUrl.length > 100 ? "..." : ""),
        timestamp: new Date().toISOString(),
      });
    }

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
    debug.log("API call successful, status:", response.status);
    debug.log("Processing response");

    // Log response information in all environments (not just development)
    debug.response("Response data type:", typeof response.data);

    // Additional URL request logging
    if (typeof fileOrUrl === "string") {
      debug.response("URL-based transcription response received", {
        url_length: fileOrUrl.length,
        url_preview:
          fileOrUrl.substring(0, 50) + (fileOrUrl.length > 50 ? "..." : ""),
        response_status: response.status,
        response_type: typeof response.data,
        timestamp: new Date().toISOString(),
      });
    }

    // Always log response data sample for debugging regardless of environment
    if (typeof response.data === "string") {
      debug.response(
        "String response data preview:",
        response.data.substring(0, 300) +
          (response.data.length > 300 ? "..." : "")
      );

      // Try to parse JSON if response is a string
      try {
        const parsedData = JSON.parse(response.data);
        debug.response("Parsed response data keys:", Object.keys(parsedData));
        // Update responseData to use the parsed version
        response.data = parsedData;
      } catch (e) {
        debug.response("Response is not JSON parsable string");
      }
    } else if (typeof response.data === "object" && response.data !== null) {
      // Log object structure in a readable way
      const keys = Object.keys(response.data);
      debug.response("Object response data keys:", keys);

      // Log a preview of each main key value
      keys.forEach((key) => {
        const value = response.data[key];
        const valuePreview =
          typeof value === "string"
            ? value.length > 100
              ? value.substring(0, 100) + "..."
              : value
            : Array.isArray(value)
            ? `Array with ${value.length} items`
            : typeof value;

        debug.response(`Key "${key}":`, valuePreview);
      });
    }

    // Handle different response formats
    const responseData = response.data;
    let text, segments, structuredConversation;

    debug.log("TRANSCRIPTION: Processing response format", {
      response_type: typeof responseData,
      has_text: responseData.text !== undefined,
      has_id:
        responseData.id !== undefined || responseData.task_id !== undefined,
      is_string: typeof responseData === "string",
      timestamp: new Date().toISOString(),
    });

    // Check if we have a text property anywhere in the response
    if (responseData.text !== undefined) {
      // Direct result format
      text = responseData.text;
      debug.log("TRANSCRIPTION: Direct text result found", {
        text_length: text.length,
        text_preview: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      });

      // If segments exist, process them
      if (Array.isArray(responseData.segments)) {
        segments = responseData.segments;
        debug.log("TRANSCRIPTION: Segments found", {
          segment_count: segments.length,
        });

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
        debug.log("TRANSCRIPTION: No segments found, creating default segment");
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

      debug.log(
        "TRANSCRIPTION: Returning successful response with text and segments"
      );
      return NextResponse.json({
        text,
        segments,
        structuredConversation,
      });
    } else if (responseData.id || responseData.task_id) {
      // This is an async task that we'll need to poll for
      const resultId = responseData.id || responseData.task_id;
      debug.log("TRANSCRIPTION: Async task detected", {
        result_id: resultId,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ resultId });
    } else if (typeof responseData === "string") {
      // Try to handle plain text response
      text = responseData;
      debug.log("TRANSCRIPTION: Plain text response detected", {
        text_length: text.length,
        text_preview: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        timestamp: new Date().toISOString(),
      });

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

      debug.log("TRANSCRIPTION: Returning successful response from plain text");
      return NextResponse.json({
        text,
        segments,
        structuredConversation,
      });
    } else {
      // Log entire response for debugging
      debug.error("TRANSCRIPTION ERROR: Unexpected response format", {
        response_data: JSON.stringify(response.data, null, 2),
        response_type: typeof response.data,
        timestamp: new Date().toISOString(),
      });
      throw new Error("Unexpected response format from transcription service");
    }
  } catch (error) {
    debug.error("TRANSCRIPTION ERROR: Transcription process failed", {
      error_name: error instanceof Error ? error.name : "Unknown error type",
      error_message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    if (axios.isAxiosError(error)) {
      // Log the full error response for debugging
      debug.error("TRANSCRIPTION ERROR: Axios request failed", {
        status: error.response?.status || "No status",
        status_text: error.response?.statusText || "No status text",
        response_data: JSON.stringify(error.response?.data || "No data"),
        request_url: error.config?.url || "No URL",
        request_method: error.config?.method || "No method",
        timestamp: new Date().toISOString(),
      });

      // Additional logging for URL-based request failures
      if (typeof fileOrUrl === "string") {
        debug.error("TRANSCRIPTION ERROR: URL-based transcription failed", {
          url_length: fileOrUrl.length,
          url_preview:
            fileOrUrl.substring(0, 100) + (fileOrUrl.length > 100 ? "..." : ""),
          error_status: error.response?.status,
          error_data: JSON.stringify(error.response?.data || "No data"),
          timestamp: new Date().toISOString(),
        });
      }

      const statusCode = error.response?.status || 500;
      let message = "Failed to transcribe audio/video";

      // Use the API's error message if available
      if (error.response?.data?.error?.message) {
        message = error.response.data.error.message;
      }

      // Enhanced error status code logging and handling
      switch (statusCode) {
        case 400:
          debug.error("TRANSCRIPTION ERROR: Bad Request", {
            error_details: "Invalid parameters or malformed request",
            input_type: typeof fileOrUrl === "string" ? "URL" : "File",
            timestamp: new Date().toISOString(),
          });
          message = "Invalid request parameters";
          break;
        case 401:
        case 403:
          debug.error("TRANSCRIPTION ERROR: Authentication Failed", {
            error_details: "Invalid or missing API key",
            status_code: statusCode,
            timestamp: new Date().toISOString(),
          });
          message = "Service authentication error";
          break;
        case 413:
          debug.error("TRANSCRIPTION ERROR: File Size Error", {
            error_details: "File exceeds maximum size limit",
            file_size: fileOrUrl instanceof File ? fileOrUrl.size : "N/A (URL)",
            max_size: FILE_LIMITS.MAX_SIZE,
            timestamp: new Date().toISOString(),
          });
          message = FILE_SIZE_ERROR.OVER_LIMIT;
          break;
        case 415:
          debug.error("TRANSCRIPTION ERROR: Unsupported Media Type", {
            error_details: "Invalid file format",
            file_type: fileOrUrl instanceof File ? fileOrUrl.type : "N/A (URL)",
            timestamp: new Date().toISOString(),
          });
          message = FILE_SIZE_ERROR.INVALID_FORMAT("unknown format");
          break;
        case 429:
          debug.error("TRANSCRIPTION ERROR: Rate Limit Exceeded", {
            error_details: "Too many requests",
            timestamp: new Date().toISOString(),
          });
          message = "Rate limit exceeded. Please try again later";
          break;
        default:
          debug.error(
            `TRANSCRIPTION ERROR: Unexpected Status Code ${statusCode}`,
            {
              status_code: statusCode,
              response_data: JSON.stringify(error.response?.data || "No data"),
              timestamp: new Date().toISOString(),
            }
          );
      }

      debug.error("TRANSCRIPTION ERROR: Returning error response to client", {
        status_code: statusCode,
        message: message,
        timestamp: new Date().toISOString(),
      });

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

    debug.error("TRANSCRIPTION ERROR: Non-Axios error", {
      error_type:
        error instanceof Error ? error.constructor.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error),
      error_stack: error instanceof Error ? error.stack : "No stack trace",
      timestamp: new Date().toISOString(),
    });

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
