import type { Metadata } from "next";
import { DownloadPageContent } from "./DownloadPageContent";

export const metadata: Metadata = {
  title: "Download | RIFT",
  description:
    "Download RIFT for macOS, Windows, Linux, iOS, and Android. AI-powered penetration testing at your fingertips.",
  openGraph: {
    title: "Download RIFT",
    description:
      "Download RIFT for macOS, Windows, Linux, iOS, and Android. AI-powered penetration testing at your fingertips.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Download RIFT",
    description:
      "Download RIFT for macOS, Windows, Linux, iOS, and Android. AI-powered penetration testing at your fingertips.",
  },
};

export default function DownloadPage() {
  return <DownloadPageContent />;
}
