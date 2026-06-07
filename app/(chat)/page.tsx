"use client";

import React from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { ChatInput } from "../components/ChatInput";
import Header from "../components/Header";
import Waves from "../components/Waves";
import Footer from "../components/Footer";
import { Chat } from "../components/chat";
import PricingDialog from "../components/PricingDialog";
import TeamPricingDialog from "../components/TeamPricingDialog";
import { TeamWelcomeDialog } from "../components/TeamDialogs";
import MigratePentestgptDialog from "../components/MigratePentestgptDialog";
import { ExtraUsagePurchaseToast } from "../components/extra-usage";
import { usePricingDialog } from "../hooks/usePricingDialog";
import { useGlobalState } from "../contexts/GlobalState";
import { useInputValue } from "../contexts/InputContext";
import { usePentestgptMigration } from "../hooks/usePentestgptMigration";
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
    <div className="relative h-full flex flex-col overflow-hidden bg-[#0a0a0c]">
      {/* Animated waves background (zauth-style) */}
      <Waves
        className="pointer-events-none z-0"
        lineColor="rgba(63, 63, 70, 0.4)"
        backgroundColor="transparent"
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        xGap={12}
        yGap={36}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
      />
      {/* Soft top spotlight */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(70%_55%_at_50%_-5%,rgba(255,255,255,0.06),transparent_72%)]" />

      <div className="relative z-10 flex-shrink-0">
        <Header />
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {/* Centered content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-[15vh] pb-[18vh] min-h-0">
          {/* Title */}
          <div className="mb-10 flex flex-col items-center px-4 text-center">
            <h1 className="text-balance text-5xl font-normal leading-[1.02] tracking-tight text-foreground sm:text-6xl md:text-7xl">
              <span className="block">Find vulnerabilities</span>
              <span className="display-emphasis block">
                before they&apos;re exploited.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
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
  const {
    subscription,
    teamPricingDialogOpen,
    setTeamPricingDialogOpen,
    teamWelcomeDialogOpen,
    setTeamWelcomeDialogOpen,
    migrateFromPentestgptDialogOpen,
    setMigrateFromPentestgptDialogOpen,
  } = useGlobalState();
  const { showPricing, handleClosePricing } = usePricingDialog(subscription);

  const { isMigrating, migrate } = usePentestgptMigration();
  const searchParams =
    typeof window !== "undefined" ? window.location.search : "";
  const { initialSeats, initialPlan } = React.useMemo(() => {
    if (typeof window === "undefined") {
      return { initialSeats: 5, initialPlan: "monthly" as const };
    }
    const urlParams = new URLSearchParams(searchParams);
    const urlSeats = urlParams.get("numSeats");
    const urlPlan = urlParams.get("selectedPlan");

    let seats = 5;
    if (urlSeats) {
      const parsed = parseInt(urlSeats, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        seats = parsed;
      }
    }

    const plan = (urlPlan === "yearly" ? "yearly" : "monthly") as
      | "monthly"
      | "yearly";

    return { initialSeats: seats, initialPlan: plan };
  }, [searchParams]);

  return (
    <>
      <Authenticated>
        <AuthenticatedContent />
        <ExtraUsagePurchaseToast />
        <PricingDialog isOpen={showPricing} onClose={handleClosePricing} />
        <TeamPricingDialog
          isOpen={teamPricingDialogOpen}
          onClose={() => setTeamPricingDialogOpen(false)}
          initialSeats={initialSeats}
          initialPlan={initialPlan}
        />
        <TeamWelcomeDialog
          open={teamWelcomeDialogOpen}
          onOpenChange={setTeamWelcomeDialogOpen}
        />
        <MigratePentestgptDialog
          open={migrateFromPentestgptDialogOpen}
          onOpenChange={setMigrateFromPentestgptDialogOpen}
          isMigrating={isMigrating}
          onConfirm={migrate}
        />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedContent />
      </Unauthenticated>
    </>
  );
}
