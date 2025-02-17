# Media Transcription Service

A Next.js application that transcribes audio and video files to text using Lemonfox.ai's advanced transcription API.

## Features

- 🎵 Support for multiple audio formats: MP3, WAV, FLAC, AAC, OGG, M4A
- 🎥 Support for video formats: MP4, MPEG, MOV, WEBM
- 📁 File size limits:
  - Direct upload: up to 4MB (Vercel deployment limitation)
  - URL: up to 100MB
- 🌐 Remote file transcription via URL
- 🎯 High accuracy transcription powered by Lemonfox.ai
- 📋 Easy copy-to-clipboard functionality
- 🖥️ Modern, responsive UI with drag-and-drop support

## Prerequisites

- Node.js 18 or later
- npm or yarn
- Lemonfox.ai API key

## Setup

1. Clone the repository:

```bash
git clone [repository-url]
cd speech-to-text
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory:

```bash
LEMONFOX_API_KEY=your_lemonfox_api_key_here
```

To get your Lemonfox.ai API key:

1. Create an account at [Lemonfox.ai](https://lemonfox.ai)
2. Navigate to the API section in your dashboard
3. Generate a new API key
4. Copy the key to your `.env.local` file

## Development

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

1. **Direct File Upload**

   - Drag and drop an audio/video file into the upload area
   - Or click to open the file selector
   - Supported file types: MP3, WAV, FLAC, AAC, OGG, M4A, MP4, MPEG, MOV, WEBM
   - Maximum file size: 4MB (due to Vercel deployment limitations)
   - For larger files, please use URL upload

2. **URL Transcription**

   - Paste a URL to an audio/video file in the URL input field
   - Click "Transcribe URL"
   - Maximum file size: 100MB
   - URL must point directly to a media file
   - Recommended for files larger than 4MB

3. **View and Copy Results**
   - Transcription appears below the upload area
   - Use the "Copy to Clipboard" button to copy the text
   - Preview uploaded media files in the browser

## Deployment Considerations

### Vercel Deployment

The application is optimized for deployment on Vercel with the following considerations:

1. **File Size Limitations**

   - Direct file uploads are limited to 4MB due to Vercel's API route body size restriction
   - For files larger than 4MB, use the URL upload feature

2. **URL Upload Feature**
   - Not affected by Vercel's size limitations
   - Handles files up to 100MB
   - More efficient for larger files
   - Direct URL processing by Lemonfox.ai

### Alternative Deployment Options

For applications requiring larger direct file uploads, consider:

1. Using a cloud storage service (e.g., AWS S3) for initial file upload
2. Implementing client-side direct uploads to Lemonfox
3. Deploying to a platform without body size restrictions

## Error Handling

The application handles various error cases:

- Invalid file formats
- File size limits (with clear guidance on using URL upload for larger files)
- Invalid URLs
- API errors
- Network issues

Error messages are displayed clearly to the user with suggestions for resolution.

## Technical Details

- Framework: Next.js 14 with App Router
- Styling: Tailwind CSS
- API Integration: Lemonfox.ai Transcription API
- File Handling: Native File API + FormData
- Language: TypeScript

## Component Usage

```tsx
import SpeechToText from "@/components/SpeechToText";

// Basic usage
<SpeechToText />

// With handlers
<SpeechToText
  onTranscriptionComplete={(result) => console.log(result)}
  onError={(error) => console.error(error)}
/>
```

## Environment Variables

| Variable           | Description              | Required |
| ------------------ | ------------------------ | -------- |
| `LEMONFOX_API_KEY` | Your Lemonfox.ai API key | Yes      |

## API Routes

### POST /api/transcribe

Handles both direct file uploads and URL transcription requests.

Request body (FormData):

- `file`: File object or URL string

Response:

```json
{
  "text": "Transcribed text content..."
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
