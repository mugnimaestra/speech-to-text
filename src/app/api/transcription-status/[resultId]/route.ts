import { NextRequest, NextResponse } from "next/server";
import { transcriptionResults } from "../../transcription-callback/route";

export async function GET(
  request: NextRequest,
  { params }: { params: { resultId: string } }
) {
  const { resultId } = params;

  // Check if we have results for this ID
  const result = transcriptionResults.get(resultId);

  if (!result) {
    return NextResponse.json(
      { message: "Transcription not found" },
      { status: 404 }
    );
  }

  // Return the transcription result and clean up
  transcriptionResults.delete(resultId); // Remove after retrieving
  return NextResponse.json(result);
}
