import { NextRequest, NextResponse } from "next/server";
import { TranscriptionResult } from "@/components/SpeechToText/types";
import { transcriptionStore } from "@/lib/transcriptionStore";
import { logWithContext } from "@/lib/logger";

// Validate that the request is coming from Lemonfox
const validateRequest = (request: NextRequest): boolean => {
  const requestId =
    request.headers.get("x-request-id") ||
    Math.random().toString(36).substring(7);
  const authHeader = request.headers.get("Authorization");
  const apiKey = process.env.LEMONFOX_API_KEY;

  if (!apiKey) {
    logWithContext("error", "LEMONFOX_API_KEY is not configured", {
      requestId,
    });
    return false;
  }

  // Enhanced logging in development mode
  if (process.env.NODE_ENV === "development") {
    logWithContext("debug", "Auth header format:", {
      requestId,
      authHeader: authHeader ? `${authHeader.substring(0, 10)}...` : "missing",
    });
  }

  // In development mode, skip validation to help with testing
  if (process.env.NODE_ENV === "development") {
    logWithContext("debug", "Skipping auth validation in development mode", {
      requestId,
    });
    return true;
  }

  // Check for different authorization header formats
  if (!authHeader) {
    return false;
  }

  // Check exact match for "Bearer TOKEN"
  if (authHeader === `Bearer ${apiKey}`) {
    return true;
  }

  // Allow just the token without "Bearer " prefix
  if (authHeader === apiKey) {
    return true;
  }

  // Check for Bearer with token (case insensitive)
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token === apiKey) {
      return true;
    }
  }

  return false;
};

export async function POST(request: NextRequest) {
  const requestId =
    request.headers.get("x-request-id") ||
    Math.random().toString(36).substring(7);

  try {
    // Log the headers in development mode
    if (process.env.NODE_ENV === "development") {
      logWithContext("debug", "Callback headers:", {
        requestId,
        headers: Object.fromEntries(request.headers.entries()),
      });
    }

    // Validate the request - but use our improved version
    if (!validateRequest(request)) {
      logWithContext(
        "warn",
        "Unauthorized callback attempt with invalid or missing API key",
        { requestId }
      );
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Log the raw body for debugging
    let requestBody = "";
    try {
      requestBody = await request.text();
      logWithContext("debug", "Request body:", {
        requestId,
        body:
          requestBody.substring(0, 500) +
          (requestBody.length > 500 ? "..." : ""),
      });

      // Handle potential non-JSON response
      let transcriptionResult: TranscriptionResult;
      try {
        transcriptionResult = JSON.parse(requestBody);
      } catch (e) {
        logWithContext("error", "Failed to parse callback request as JSON", {
          requestId,
          error: e,
        });
        // If parsing fails, create a simple transcription result
        transcriptionResult = {
          text: requestBody,
          segments: [
            {
              id: 0,
              text: requestBody,
              start: 0,
              end: 0,
              avg_logprob: -1,
              language: "en",
              speaker: "speaker",
              words: [],
            },
          ],
        };
      }

      // Continue with validation logic
      if (!transcriptionResult.text) {
        logWithContext(
          "warn",
          "Transcription result missing text property, using empty string",
          { requestId }
        );
        transcriptionResult.text = "";
      }

      if (!Array.isArray(transcriptionResult.segments)) {
        logWithContext(
          "warn",
          "Transcription result missing segments array, creating default",
          { requestId }
        );
        transcriptionResult.segments = [
          {
            id: 0,
            text: transcriptionResult.text || "",
            start: 0,
            end: 0,
            avg_logprob: -1,
            language: "en",
            speaker: "speaker",
            words: [],
          },
        ];
      }

      // Store the result and get an ID
      const resultId = transcriptionStore.store(transcriptionResult);

      // Development logging
      if (process.env.NODE_ENV === "development") {
        logWithContext("info", "Received transcription callback", {
          requestId,
          resultId,
          textLength: transcriptionResult.text.length,
          segmentsCount: transcriptionResult.segments.length,
        });
      }

      return NextResponse.json({ success: true, resultId });
    } catch (error) {
      logWithContext("error", "Error processing request body", {
        requestId,
        error,
      });
      throw error;
    }
  } catch (error) {
    logWithContext("error", "Error handling transcription callback", {
      requestId,
      error,
    });
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}
