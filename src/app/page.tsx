import SpeechToText from "@/components/SpeechToText";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Media Transcription Service
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Upload your audio/video files or provide a URL to get accurate
            transcriptions powered by Lemonfox.ai
          </p>
        </div>

        <SpeechToText />
      </div>
    </main>
  );
}
