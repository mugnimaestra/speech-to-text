import axios from 'axios';
import { AudioInput } from '@/components/SpeechToText/types';

const API_URL = '/api/transcribe';

export async function transcribeAudio(input: AudioInput): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', input); // Works for both File and URL string

    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.text) {
      throw new Error('No transcription received');
    }

    return response.data.text;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to transcribe media');
    }
    throw error;
  }
}