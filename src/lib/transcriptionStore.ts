import { TranscriptionResult } from "@/components/SpeechToText/types";

/**
 * In-memory store for transcription results.
 * Note: In production, this should be replaced with a proper database.
 */
class TranscriptionStore {
  private results: Map<string, TranscriptionResult>;

  constructor() {
    this.results = new Map();
  }

  /**
   * Store a transcription result
   * @returns The ID used to retrieve the result later
   */
  store(result: TranscriptionResult): string {
    const id = Date.now().toString();
    this.results.set(id, result);
    return id;
  }

  /**
   * Get a transcription result by ID
   * @returns The transcription result or null if not found
   */
  get(id: string): TranscriptionResult | null {
    const result = this.results.get(id);
    if (result) {
      // Clean up after retrieving
      this.results.delete(id);
    }
    return result || null;
  }

  /**
   * Check if a transcription result exists
   */
  has(id: string): boolean {
    return this.results.has(id);
  }
}

// Export a singleton instance
export const transcriptionStore = new TranscriptionStore();
