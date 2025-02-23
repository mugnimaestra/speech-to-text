import { TranscriptionResult } from "@/components/SpeechToText/types";

interface StoredTranscription {
  result: TranscriptionResult;
  timestamp: number;
  retrievedAt?: number;
}

/**
 * In-memory store for transcription results.
 * Note: In production, this should be replaced with a proper database.
 */
class TranscriptionStore {
  private results: Map<string, StoredTranscription>;
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_AGE = 60 * 60 * 1000; // 1 hour
  private readonly RETENTION_AFTER_RETRIEVAL = 60 * 1000; // 1 minute

  constructor() {
    this.results = new Map();
    this.startCleanupInterval();
  }

  private startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [id, stored] of this.results.entries()) {
        // Remove if it's older than MAX_AGE
        if (now - stored.timestamp > this.MAX_AGE) {
          this.results.delete(id);
          continue;
        }

        // Remove if it's been retrieved and retention period has passed
        if (
          stored.retrievedAt &&
          now - stored.retrievedAt > this.RETENTION_AFTER_RETRIEVAL
        ) {
          this.results.delete(id);
        }
      }
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Store a transcription result
   * @returns The ID used to retrieve the result later
   */
  store(result: TranscriptionResult): string {
    const id = Date.now().toString();
    this.results.set(id, {
      result,
      timestamp: Date.now(),
    });
    return id;
  }

  /**
   * Get a transcription result by ID
   * @returns The transcription result or null if not found
   */
  get(id: string): TranscriptionResult | null {
    const stored = this.results.get(id);
    if (!stored) return null;

    // Mark as retrieved but don't delete immediately
    this.results.set(id, {
      ...stored,
      retrievedAt: Date.now(),
    });

    return stored.result;
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
