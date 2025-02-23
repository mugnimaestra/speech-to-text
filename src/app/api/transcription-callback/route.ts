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

  return authHeader === `Bearer ${apiKey}`;
};

export async function POST(request: NextRequest) {
  try {
    // Validate the request
    if (!validateRequest(request)) {
      console.warn(
        "Unauthorized callback attempt with invalid or missing API key"
      );
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the transcription result
    const transcriptionResult: TranscriptionResult = await request.json();

    // Basic validation of required fields
    if (
      !transcriptionResult.text ||
      !Array.isArray(transcriptionResult.segments)
    ) {
      console.error(
        "Invalid transcription result format:",
        transcriptionResult
      );
      return NextResponse.json(
        { message: "Invalid transcription result format" },
        { status: 400 }
      );
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
    console.error("Error handling transcription callback:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}
