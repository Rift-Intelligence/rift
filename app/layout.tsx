import type { Metadata } from "next";
import { JetBrains_Mono, Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import "./globals-terminal.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { GlobalStateProvider } from "./contexts/GlobalState";
import { InputProvider } from "./contexts/InputContext";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { TodoBlockProvider } from "./contexts/TodoBlockContext";
import { PostHogProvider } from "./providers";
import { DataStreamProvider } from "./components/DataStreamProvider";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Elegant serif used for italic emphasis words in display headings
// (mirrors the zauth.inc "sans roman + serif italic" headline treatment).
const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const APP_NAME = "RIFT";
const APP_DEFAULT_TITLE = "RIFT - AI-Powered Security Testing Platform";
const APP_TITLE_TEMPLATE = "%s | RIFT";
const APP_DESCRIPTION =
  "RIFT is an AI-powered security testing platform that helps penetration testers, security researchers, and developers identify vulnerabilities, analyze threats, and secure systems faster.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: "%s",
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  keywords: [
    "rift",
    "security testing",
    "penetration testing",
    "vulnerability scanner",
    "security automation",
    "offensive security",
    "red team",
    "bug bounty",
    "cybersecurity ai",
    "security assessment",
    "threat analysis",
    "security platform",
    "pentest tool",
    "security research",
    "vulnerability detection",
  ],
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "RIFT",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "RIFT",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <GlobalStateProvider>
      <InputProvider>
        <PostHogProvider>
          <DataStreamProvider>
            <TodoBlockProvider>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </TodoBlockProvider>
          </DataStreamProvider>
        </PostHogProvider>
      </InputProvider>
    </GlobalStateProvider>
  );

  return (
    <html
      lang="en"
      className="dark h-full terminal-scanlines"
      suppressHydrationWarning
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${jetbrainsMono.variable} ${inter.variable} ${instrumentSerif.variable} antialiased h-full`}
        suppressHydrationWarning
      >
        <ConvexClientProvider>{content}</ConvexClientProvider>
      </body>
    </html>
  );
}
