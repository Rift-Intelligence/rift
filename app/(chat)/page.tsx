"use client";

import React from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { ChatInput } from "../components/ChatInput";
import Header from "../components/Header";
import ZauthBackdrop from "../components/ZauthBackdrop";
import Footer from "../components/Footer";
import { Chat } from "../components/chat";
import { AsciiEye } from "../components/eye/AsciiEye";
import { useInputValue } from "../contexts/InputContext";
import { navigateToAuth } from "../hooks/useTauri";
import { useTypingAnimation } from "../hooks/useTypingAnimation";
import { upsertDraft } from "@/lib/utils/client-storage";

const LOGIN_TYPING_PREFIX = "Ask EYE to ";
const LOGIN_TYPING_TAILS = [
  "identify vulnerabilities in...",
  "assess the security posture of...",
  "penetration test...",
  "analyze the attack surface of...",
  "generate a security report for...",
  "hunt for threats in...",
];

// Simple unauthenticated content that redirects to signup on message send
const UnauthenticatedContent = () => {
  const input = useInputValue();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      upsertDraft("new", input);
    }
    navigateToAuth("/signup", { preferSignInForReturningUser: true });
  };

  const animatedTail = useTypingAnimation({
    phrases: LOGIN_TYPING_TAILS,
    enabled: true,
  });
  const animatedPlaceholder = `${LOGIN_TYPING_PREFIX}${animatedTail}`;

  const handleStop = () => {
    // No-op for unauthenticated users
  };

  React.useEffect(() => {
    const checkHash = () => {
      if (
        window.location.hash === "#pricing" ||
        window.location.hash === "#team-pricing-seat-selection"
      ) {
        navigateToAuth("/signup?intent=pricing", {
          preferSignInForReturningUser: true,
        });
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-background">
      {/* zauth-grade atmosphere: conic glow + dot-matrix field + bottom fade */}
      <ZauthBackdrop className="z-0" />

      <div className="relative z-10 flex-shrink-0">
        <Header />
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {/* Centered content area */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-6 py-10 min-h-0">
          {/* The EYE — blinking optic inside a HUD scope frame */}
          <div className="hud scanlines relative mb-8 w-full max-w-[560px] overflow-hidden bg-transparent">
            <span className="hud-corners" aria-hidden />
            <div className="flex items-center justify-between px-3 py-1">
              <span className="hud-label">EYE // OPTICAL CORE</span>
              <span className="hud-label flex items-center gap-1.5">
                <span className="inline-block size-1.5 rounded-full bg-primary eye-live" />
                WATCHING
              </span>
            </div>
            <AsciiEye className="eye-glitch-in block h-[22vh] max-h-[200px] min-h-[140px] w-full" />
            <div className="flex items-center justify-between px-3 py-1">
              <span className="hud-label">LAT —— LON ——</span>
              <span className="hud-label text-primary">● ONLINE</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-10 flex flex-col items-center px-4 text-center">
            <h1 className="animate-fade-in-up text-balance text-5xl font-normal leading-[1.04] tracking-tight text-foreground sm:text-6xl md:text-7xl">
              <span className="block">See everything.</span>
              <span className="display-emphasis animate-hero-highlight block">
                Miss nothing.
              </span>
            </h1>
            <p
              className="animate-fade-in-up mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ animationDelay: "1s" }}
            >
              Point EYE at any target. It runs recon, exploitation, and
              reporting on its own — every operation isolated in its own
              sandbox.
            </p>
          </div>

          {/* Input */}
          <div className="w-full max-w-3xl">
            <ChatInput
              onSubmit={handleSubmit}
              onStop={handleStop}
              onSendNow={() => {}}
              status="ready"
              isCentered={true}
              isNewChat={true}
              clearDraftOnSubmit={false}
              placeholder={animatedPlaceholder}
              autoFocus={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0">
          <Footer />
        </div>
      </div>
    </div>
  );
};

// Authenticated content that shows chat (UUID generated internally)
const AuthenticatedContent = () => {
  return <Chat autoResume={false} />;
};

// Main page component with Convex authentication
export default function Page() {
  return (
    <>
      <Authenticated>
        <AuthenticatedContent />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedContent />
      </Unauthenticated>
    </>
  );
}
