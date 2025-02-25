import { NextRequest, NextResponse } from "next/server";
import { TranscriptionResult } from "@/components/SpeechToText/types";
import { transcriptionStore } from "@/lib/transcriptionStore";

// Validate that the request is coming from Lemonfox
const validateRequest = (request: NextRequest): boolean => {
  const authHeader = request.headers.get("Authorization");
  const apiKey = process.env.LEMONFOX_API_KEY;

  if (!apiKey) {
    console.error("LEMONFOX_API_KEY is not configured");
    return false;
  }

  // Enhanced logging in development mode
  if (process.env.NODE_ENV === "development") {
    console.log(
      "Auth header format:",
      authHeader ? `${authHeader.substring(0, 10)}...` : "missing"
    );
  }

  // In development mode, skip validation to help with testing
  if (process.env.NODE_ENV === "development") {
    console.log("Skipping auth validation in development mode");
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
  try {
    // Log the headers in development mode
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Callback headers:",
        Object.fromEntries(request.headers.entries())
      );
    }

    // Validate the request - but use our improved version
    if (!validateRequest(request)) {
      console.warn(
        "Unauthorized callback attempt with invalid or missing API key"
      );
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Log the raw body for debugging
    let requestBody = "";
    try {
      requestBody = await request.text();
      console.log(
        "Request body:",
        requestBody.substring(0, 500) + (requestBody.length > 500 ? "..." : "")
      );

      // Handle potential non-JSON response
      let transcriptionResult: TranscriptionResult;
      try {
        transcriptionResult = JSON.parse(requestBody);
      } catch (e) {
        console.error("Failed to parse callback request as JSON", e);
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
        console.warn(
          "Transcription result missing text property, using empty string"
        );
        transcriptionResult.text = "";
      }

      if (!Array.isArray(transcriptionResult.segments)) {
        console.warn(
          "Transcription result missing segments array, creating default"
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
        console.log("Received transcription callback for resultId:", resultId);
        console.log("Text length:", transcriptionResult.text.length);
        console.log("Number of segments:", transcriptionResult.segments.length);
      }

      return NextResponse.json({ success: true, resultId });
    } catch (error) {
      console.error("Error processing request body:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error handling transcription callback:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}
