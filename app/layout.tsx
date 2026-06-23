import type { Metadata } from "next";
import {
  JetBrains_Mono,
  Geist,
  Space_Grotesk,
  Instrument_Serif,
  Montserrat,
  Pixelify_Sans,
} from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { GlobalStateProvider } from "./contexts/GlobalState";
import { InputProvider } from "./contexts/InputContext";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { TodoBlockProvider } from "./contexts/TodoBlockContext";
import { PostHogProvider } from "./providers";
import { DataStreamProvider } from "./components/DataStreamProvider";
import { ThemeProvider } from "./components/ThemeProvider";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Geist = clean, readable body (UI default). Space Grotesk = geometric display
// font for brand wordmark and headings (the bit of RIFT character).
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
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

// Montserrat = bold, geometric display sans for the high-energy landing
// (heavy UPPERCASE headlines, à la the snulja reference).
const montserrat = Montserrat({
  variable: "--font-montserrat-src",
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
});

// Pixelify Sans = chunky pixel display, standing in for the snulja "Pixeloid"
// brand/accent face (big RIFT wordmark, pixel numerals, kicker labels).
const pixelifySans = Pixelify_Sans({
  variable: "--font-pixel-src",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const APP_NAME = "RIFT";
const APP_DEFAULT_TITLE = "RIFT — Autonomous Offensive Intelligence";
const APP_TITLE_TEMPLATE = "%s | RIFT";
const APP_DESCRIPTION =
  "RIFT is an autonomous offensive-security agent. Point it at a target and it runs recon, exploitation, and reporting on its own — every operation isolated in its own sandbox.";

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
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
          />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        </head>
        <body
          className={`${jetbrainsMono.variable} ${geist.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${montserrat.variable} ${pixelifySans.variable} antialiased h-full`}
          suppressHydrationWarning
        >
          <ThemeProvider>
            <ConvexClientProvider>{content}</ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
