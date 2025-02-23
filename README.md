# Media Transcription Service

A Next.js application that transcribes audio and video files to text using Lemonfox.ai's advanced transcription API.

## Features

- 🎵 Support for multiple audio formats: MP3, WAV, FLAC, OPUS, OGG, M4A
- 🎥 Support for video formats: MP4, MPEG, MOV, WEBM
- 📁 File size limits:
  - Direct upload: up to 100MB
  - URL: up to 1GB
- 🌐 Remote file transcription via URL
- 🎯 High accuracy transcription powered by Lemonfox.ai
- 📋 Easy copy-to-clipboard functionality
- 🖥️ Modern, responsive UI with drag-and-drop support

## Prerequisites

- Node.js 18 or later
- Yarn 4
- Lemonfox.ai API key

## Setup

1. Clone the repository:

```bash
git clone [repository-url]
cd speech-to-text
```

2. Install dependencies:

```bash
yarn install
```

3. Create a `.env.local` file in the root directory:

```bash
LEMONFOX_API_KEY=your_lemonfox_api_key_here
NEXT_PUBLIC_ACCESS_CODE=your_access_code_here  # Access code for authentication
```

To get your Lemonfox.ai API key:

1. Create an account at [Lemonfox.ai](https://lemonfox.ai)
2. Navigate to the API section in your dashboard
3. Generate a new API key
4. Copy the key to your `.env.local` file

## Development

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

1. **Direct File Upload**

   - Drag and drop an audio/video file into the upload area
   - Or click to open the file selector
   - Supported file types: MP3, WAV, FLAC, OPUS, OGG, M4A, MP4, MPEG, MOV, WEBM
   - Maximum file size: 100MB
   - For larger files, please use URL upload

2. **URL Transcription**

   - Paste a URL to an audio/video file in the URL input field
   - Click "Transcribe URL"
   - Maximum file size: 1GB
   - URL must point directly to a media file

3. **View and Copy Results**
   - Transcription appears below the upload area
   - Use the "Copy to Clipboard" button to copy the text
   - Preview uploaded media files in the browser

## Deployment

### Railway.app Deployment

The application is optimized for deployment on Railway.app with the following features:

1. **File Size Support**
   - Direct file uploads up to 100MB
   - URL-based uploads up to 1GB
   - No timeout issues for long transcriptions (up to 1 hour)

2. **Deployment Steps**
   1. Push your code to GitHub/GitLab
   2. Create an account on [Railway.app](https://railway.app)
   3. Create a new project and select "Deploy from GitHub repo"
   4. Connect your repository
   5. Select the "Next.js" template when prompted
   6. Add environment variables in Railway's dashboard:
      - LEMONFOX_API_KEY: Your Lemonfox API key (required)
      - NEXT_PUBLIC_ACCESS_CODE: Your chosen access code for authentication (required)
   7. Railway will automatically:
      - Detect your Next.js application
      - Install dependencies
      - Build the application
      - Deploy it with the proper configuration

Note: Railway automatically detects and optimizes the deployment for Next.js applications. You don't need any additional Docker configuration as Railway handles the build and deployment process natively.

## Error Handling

The application handles various error cases:

- Invalid file formats
- File size limits
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

| Variable                | Description                                          | Required |
| ---------------------- | ---------------------------------------------------- | -------- |
| `LEMONFOX_API_KEY`     | Your Lemonfox.ai API key                            | Yes      |
| `NEXT_PUBLIC_ACCESS_CODE` | Access code for application authentication          | Yes      |

## API Routes

### POST /api/transcribe

Handles both direct file uploads and URL transcription requests.

Request body (FormData):
- `file`: File object or URL string

Response:
```json
{
  "text": "Transcribed text content",
  "segments": [
    {
      "id": 1,
      "text": "Segment text",
      "start": 0.0,
      "end": 1.0,
      "speaker": "A"
    }
  ]
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
