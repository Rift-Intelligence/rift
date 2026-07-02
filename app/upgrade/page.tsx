"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { ArrowLeft, Check } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/hooks/useAuth";
import { RiftLogo } from "@/components/icons/rift-logo";
import { Button } from "@/components/ui/button";
import { BuyExtraUsageDialog } from "@/app/components/extra-usage";
import { formatTokens } from "@/lib/billing/token-display";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tier = "free" | "pro" | "ultra";

const PLANS: {
  tier: Tier;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  featured?: boolean;
}[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    cadence: "",
    tagline: "Kick the tires",
    features: [
      "10 questions per day",
      "1 full agent run each month",
      "Build, Create & Secure",
      "Isolated cloud sandbox",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$39",
    cadence: "/mo",
    tagline: "For daily operators",
    features: [
      "500,000 credits every month",
      "All models & capabilities",
      "Unlimited chats & projects",
      "Priority sandboxes",
    ],
    featured: true,
  },
  {
    tier: "ultra",
    name: "Max",
    price: "$129",
    cadence: "/mo",
    tagline: "Highest limits",
    features: [
      "1,800,000 credits every month",
      "Personal API keys",
      "Highest limits & priority",
      "Early access to new tools",
    ],
  },
];

const RANK: Record<Tier, number> = { free: 0, pro: 1, ultra: 2 };

export default function UpgradePage() {
  const router = useRouter();
  const { user } = useAuth();
  const activeSubscription = useQuery(api.subscriptions.getActiveSubscription);
  const extraUsageSettings = useQuery(api.extraUsage.getExtraUsageSettings);

  const createSubscription = useAction(
    api.extraUsageActions.createLemonsqueezySubscription,
  );
  const createTopup = useAction(api.extraUsageActions.createLemonsqueezyTopup);

  const [isUpgrading, setIsUpgrading] = useState<null | "pro" | "ultra">(null);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const currentTier: Tier = activeSubscription
    ? activeSubscription.tier === "ultra"
      ? "ultra"
      : "pro"
    : "free";

  const balancePoints = extraUsageSettings?.balancePoints ?? 0;

  // Subscribe → LemonSqueezy hosted checkout (redirect to payment).
  const handleUpgrade = async (tier: "pro" | "ultra") => {
    if (!user) {
      router.push("/login?redirect=/upgrade");
      return;
    }
    setIsUpgrading(tier);
    try {
      const result = await createSubscription({
        tier,
        baseUrl: window.location.origin,
      });
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Could not start checkout");
        setIsUpgrading(null);
      }
    } catch {
      toast.error("Could not start checkout");
      setIsUpgrading(null);
    }
  };

  // Pay-as-you-go credit top-up → LemonSqueezy hosted checkout.
  const handlePurchaseCredits = async (amountDollars: number) => {
    if (!user) {
      router.push("/login?redirect=/upgrade");
      return;
    }
    setIsPurchasing(true);
    try {
      const result = await createTopup({
        amountDollars,
        baseUrl: window.location.origin,
      });
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Could not start checkout");
      }
    } catch {
      toast.error("Could not start checkout");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5"
          aria-label="RIFT home"
        >
          <RiftLogo size={26} />
          <span className="text-[15px] font-semibold tracking-tight">RIFT</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to app
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-24">
        {/* Hero */}
        <div className="mx-auto max-w-2xl pt-8 pb-10 text-center sm:pt-12">
          <h1 className="font-display text-[2rem] leading-[1.05] tracking-tight sm:text-[2.6rem]">
            {currentTier === "free" ? "Upgrade your plan" : "Manage your plan"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-[14.5px] leading-relaxed text-muted-foreground">
            {currentTier === "free"
              ? "Unlock monthly credits and every capability across Build, Create and Secure — cancel anytime."
              : `You're on ${currentTier === "ultra" ? "Max" : "Pro"}. Switch plans or top up credits below.`}
          </p>
        </div>

        {/* Plans */}
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.tier === currentTier;
            const isUpgrade = RANK[plan.tier] > RANK[currentTier];
            return (
              <div
                key={plan.tier}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6 transition-colors",
                  plan.featured
                    ? "border-primary/40 bg-primary/[0.04]"
                    : "border-border bg-card",
                  isCurrent && "border-primary/60",
                )}
              >
                {plan.featured && !isCurrent && (
                  <span className="absolute -top-2.5 left-6 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    Most popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-2.5 left-6 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                    Current plan
                  </span>
                )}

                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{plan.name}</span>
                  <span className="text-[12.5px] text-muted-foreground">
                    {plan.tagline}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-[2rem] leading-none tracking-tight">
                    {plan.price}
                  </span>
                  {plan.cadence && (
                    <span className="text-[13px] text-muted-foreground">
                      {plan.cadence}
                    </span>
                  )}
                </div>

                <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[13px] text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {plan.tier === "free" ? (
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      disabled
                    >
                      {currentTier === "free" ? "Your plan" : "Included"}
                    </Button>
                  ) : isCurrent ? (
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      disabled
                    >
                      Current plan
                    </Button>
                  ) : (
                    <Button
                      variant={plan.featured ? "default" : "outline"}
                      size="lg"
                      className="w-full"
                      disabled={isUpgrading !== null}
                      onClick={() =>
                        handleUpgrade(plan.tier as "pro" | "ultra")
                      }
                    >
                      {isUpgrading === plan.tier
                        ? "Redirecting…"
                        : isUpgrade
                          ? `Get ${plan.name}`
                          : `Switch to ${plan.name}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add-on credits — stack on top of the plan's monthly allowance */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-[14px] font-semibold">Add-on credits</p>
              <p className="max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
                {currentTier === "free"
                  ? "Add-on credits stack on top of a plan's monthly allowance. Pick a plan above, then top up whenever you need more."
                  : "Stack extra credits on top of your monthly allowance — they don't expire, and bigger packs include bonus credits."}{" "}
                <span className="whitespace-nowrap">
                  Balance:{" "}
                  <span className="tabular-nums text-foreground">
                    {formatTokens(balancePoints)} credits
                  </span>
                  .
                </span>
              </p>
            </div>
          </div>
          <Button
            size="lg"
            variant="outline"
            className="shrink-0"
            onClick={() => {
              if (!user) {
                router.push("/login?redirect=/upgrade");
                return;
              }
              setShowBuyDialog(true);
            }}
          >
            Add credits
          </Button>
        </div>

        <p className="mt-6 text-center text-[12px] text-muted-foreground/80">
          Payments are processed securely by LemonSqueezy (our merchant of
          record). Cancel or change your plan anytime.
        </p>
      </main>

      <BuyExtraUsageDialog
        open={showBuyDialog}
        onOpenChange={setShowBuyDialog}
        onPurchase={handlePurchaseCredits}
        isLoading={isPurchasing}
        title="Add-on credits"
        description="Credits stack on top of your plan's monthly allowance and never expire. Bigger packs include bonus credits."
        lineItemLabel="Credits"
      />
    </div>
  );
}
