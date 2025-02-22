import { NextRequest, NextResponse } from "next/server";
import { transcriptionStore } from "@/lib/transcriptionStore";

export async function GET(
  request: NextRequest,
  { params }: { params: { resultId: string } }
) {
  const { resultId } = params;

  // Check if we have results for this ID
  const result = transcriptionStore.get(resultId);

  if (!result) {
    return NextResponse.json(
      { message: "Transcription not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
