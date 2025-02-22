import { NextRequest, NextResponse } from "next/server";
import { TranscriptionResult } from "@/components/SpeechToText/types";

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

    // Here you can:
    // 1. Store the result in a database
    // 2. Emit a server-sent event
    // 3. Update a WebSocket connection
    // 4. Or use any other method to notify the client

    // For now, let's just log it in development
    if (process.env.NODE_ENV === "development") {
      console.log("Received transcription callback:", transcriptionResult);
    }

    // Store the result in server memory (temporary solution)
    // In production, you should use a proper database
    const resultId = Date.now().toString();
    transcriptionResults.set(resultId, transcriptionResult);

    return NextResponse.json({ success: true, resultId });
  } catch (error) {
    console.error("Error handling transcription callback:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Temporary storage for transcription results
// In production, use a proper database
const transcriptionResults = new Map<string, TranscriptionResult>();

// Export the map so it can be accessed by the polling endpoint
export { transcriptionResults };
