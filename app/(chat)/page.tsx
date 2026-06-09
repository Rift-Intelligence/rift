"use client";

import React from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { ChatInput } from "../components/ChatInput";
import Header from "../components/Header";
import ZauthBackdrop from "../components/ZauthBackdrop";
import Footer from "../components/Footer";
import { Chat } from "../components/chat";
import { useInputValue } from "../contexts/InputContext";
import { navigateToAuth } from "../hooks/useTauri";
import { useTypingAnimation } from "../hooks/useTypingAnimation";
import { upsertDraft } from "@/lib/utils/client-storage";

const LOGIN_TYPING_PREFIX = "Ask Rift to ";
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
    <div className="relative h-full flex flex-col overflow-hidden bg-[#1d1d1d]">
      {/* zauth-grade atmosphere: conic glow + dot-matrix field + bottom fade */}
      <ZauthBackdrop className="z-0" />

      <div className="relative z-10 flex-shrink-0">
        <Header />
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {/* Centered content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-[15vh] pb-[18vh] min-h-0">
          {/* Title */}
          <div className="mb-10 flex flex-col items-center px-4 text-center">
            <h1 className="animate-fade-in-up text-balance text-5xl font-normal leading-[1.04] tracking-tight text-[#f4f4f5] sm:text-6xl md:text-7xl">
              <span className="block">Find vulnerabilities</span>
              <span className="display-emphasis animate-hero-highlight block">
                before they&apos;re exploited.
              </span>
            </h1>
            <p
              className="animate-fade-in-up mt-6 max-w-xl text-pretty text-base leading-relaxed text-[#a1a1aa] sm:text-lg"
              style={{ animationDelay: "1s" }}
            >
              Point RIFT at any target. It handles recon, exploitation, and
              reporting on its own — every run isolated in its own sandbox.
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
