import type { Metadata } from "next";
import {
  JetBrains_Mono,
  Geist,
  Space_Grotesk,
  Instrument_Serif,
  Montserrat,
  Archivo,
  Pixelify_Sans,
} from "next/font/google";
import Script from "next/script";
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

// Montserrat = geometric sans for the landing. Loaded as a VARIABLE font (no
// fixed weight array) so headings can animate their weight continuously on
// scroll — the air.dev signature micro-interaction (see WeightyHeading).
const montserrat = Montserrat({
  variable: "--font-montserrat-src",
  subsets: ["latin"],
  display: "swap",
});

// Archivo = squarish geometric grotesque, VARIABLE (wght 100–900) — the closest
// free stand-in for air.dev's "Modul Air" display face. Used for landing
// headings with the scroll-driven weight animation (see WeightyHeading).
const archivo = Archivo({
  variable: "--font-archivo-src",
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
const APP_DEFAULT_TITLE = "RIFT — The Professional AI Agent";
const APP_TITLE_TEMPLATE = "%s | RIFT";
const APP_DESCRIPTION =
  "RIFT is a professional AI agent that builds software, creates images, and runs security tests. Describe what you need and it plans, runs the real tools in an isolated cloud sandbox, and delivers the finished result.";

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
    "ai agent",
    "ai app builder",
    "build apps with ai",
    "ai coding agent",
    "ai image generator",
    "ai photo editor",
    "autonomous agent",
    "ai software development",
    "cloud sandbox",
    "security testing",
    "ai security assessment",
    "professional ai",
    "ai productivity",
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
          {/* In the RIFT desktop (Tauri) wrapper, flag the document so the
              sidebar goes translucent and the macOS window vibrancy shows
              through as real "glass". Runs before paint (no flash); no-op in a
              regular browser. */}
          <script
            dangerouslySetInnerHTML={{
              __html:
                "try{if((navigator.userAgent||'').includes('RIFTWrapperLite')||window.__RIFT_DESKTOP_LITE__===true){document.documentElement.classList.add('rift-vibrancy')}}catch(e){}",
            }}
          />
        </head>
        <body
          className={`${jetbrainsMono.variable} ${geist.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${montserrat.variable} ${archivo.variable} ${pixelifySans.variable} antialiased h-full`}
          suppressHydrationWarning
        >
          <ThemeProvider>
            <ConvexClientProvider>{content}</ConvexClientProvider>
          </ThemeProvider>
          {/* Google Ads tag (gtag.js) — conversion tracking */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=AW-18267889487"
            strategy="afterInteractive"
          />
          <Script id="google-ads-gtag" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18267889487');
            `}
          </Script>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
