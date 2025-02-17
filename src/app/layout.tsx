import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AccessGate from "@/components/AccessGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Media Transcription Service",
  description:
    "Convert audio and video files to text using Lemonfox.ai's advanced transcription API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AccessGate>{children}</AccessGate>
      </body>
    </html>
  );
}
