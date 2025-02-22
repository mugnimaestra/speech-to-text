import { NextRequest, NextResponse } from "next/server";
import { TranscriptionResult } from "@/components/SpeechToText/types";
import { transcriptionStore } from "@/lib/transcriptionStore";

// Validate that the request is coming from Lemonfox
const validateRequest = (request: NextRequest): boolean => {
  // You should implement proper validation here
  // For example, check for a secret token or signature
  const authHeader = request.headers.get("Authorization");
  return authHeader === `Bearer ${process.env.LEMONFOX_API_KEY}`;
};

export async function POST(request: NextRequest) {
  try {
    // Validate the request
    if (!validateRequest(request)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse the transcription result
    const transcriptionResult: TranscriptionResult = await request.json();

    // Store the result and get an ID
    const resultId = transcriptionStore.store(transcriptionResult);

    // For development logging
    if (process.env.NODE_ENV === "development") {
      console.log("Received transcription callback:", transcriptionResult);
    }

    return NextResponse.json({ success: true, resultId });
  } catch (error) {
    console.error("Error handling transcription callback:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
