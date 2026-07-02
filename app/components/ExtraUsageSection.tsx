"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatTokens } from "@/lib/billing/token-display";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  TurnOffExtraUsageDialog,
  AdjustSpendingLimitDialog,
  AutoReloadDialog,
} from "@/app/components/extra-usage";

const ExtraUsageSection = () => {
  // User customization for extra usage enabled flag
  const userCustomization = useQuery(
    api.userCustomization.getUserCustomization,
  );
  const saveUserCustomization = useMutation(
    api.userCustomization.saveUserCustomization,
  );

  // Extra usage settings (balance and auto-reload config)
  const extraUsageSettings = useQuery(api.extraUsage.getExtraUsageSettings);
  const updateExtraUsageSettings = useMutation(
    api.extraUsage.updateExtraUsageSettings,
  );

  // Convex actions. Card payments + subscriptions now go through LemonSqueezy
  // (merchant of record, handles VAT). getPaymentStatus is still used to gate
  // auto-reload (which uses the saved Stripe card).
  const getPaymentStatus = useAction(api.extraUsageActions.getPaymentStatus);
  const createLemonsqueezySubscription = useAction(
    api.extraUsageActions.createLemonsqueezySubscription,
  );
  const activeSubscription = useQuery(api.subscriptions.getActiveSubscription);

  // Loading states
  const [isTogglingExtraUsage, setIsTogglingExtraUsage] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<null | "pro" | "ultra">(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Dialog states
  const [showTurnOffDialog, setShowTurnOffDialog] = useState(false);
  const [showSpendingLimitDialog, setShowSpendingLimitDialog] = useState(false);
  const [showAutoReloadDialog, setShowAutoReloadDialog] = useState(false);

  // Extra usage toggle handler
  const handleToggleExtraUsage = async (enabled: boolean) => {
    if (isTogglingExtraUsage) return;

    // If turning off, show confirmation dialog
    if (!enabled) {
      setShowTurnOffDialog(true);
      return;
    }

    setIsTogglingExtraUsage(true);
    try {
      // Check if user has a valid payment method before enabling
      const paymentStatus = await getPaymentStatus();

      if (!paymentStatus.hasPaymentMethod) {
        toast.error(
          "Please add a payment method in the billing portal before enabling extra usage.",
        );
        setIsTogglingExtraUsage(false);
        return;
      }

      await saveUserCustomization({ extra_usage_enabled: true });
      toast.success("Extra usage enabled");
    } catch (error) {
      console.error("Failed to toggle extra usage:", error);
      toast.error("Failed to update extra usage setting");
    } finally {
      setIsTogglingExtraUsage(false);
    }
  };

  // Confirm turn off extra usage
  const handleConfirmTurnOff = async () => {
    setIsTogglingExtraUsage(true);
    try {
      await saveUserCustomization({ extra_usage_enabled: false });
      toast.success("Extra usage disabled");
      setShowTurnOffDialog(false);
    } catch (error) {
      console.error("Failed to turn off extra usage:", error);
      toast.error("Failed to disable extra usage");
    } finally {
      setIsTogglingExtraUsage(false);
    }
  };

  // Subscribe to / upgrade a plan (Pro or Max → "ultra") via LemonSqueezy.
  const handleUpgrade = async (tier: "pro" | "ultra") => {
    setIsUpgrading(tier);
    try {
      const result = await createLemonsqueezySubscription({
        tier,
        baseUrl: window.location.origin,
      });
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Could not start checkout");
        setIsUpgrading(null);
      }
    } catch (error) {
      console.error("Failed to start subscription checkout:", error);
      toast.error("Could not start checkout");
      setIsUpgrading(null);
    }
  };

  // Save auto-reload settings from dialog
  const handleSaveAutoReload = async (
    thresholdDollars: number,
    amountDollars: number,
  ) => {
    setIsSavingSettings(true);
    try {
      await updateExtraUsageSettings({
        autoReloadEnabled: true,
        autoReloadThresholdDollars: thresholdDollars,
        autoReloadAmountDollars: amountDollars,
      });
      toast.success("Auto-reload enabled");
      setShowAutoReloadDialog(false);
    } catch (error) {
      console.error("Failed to save auto-reload settings:", error);
      toast.error("Failed to save auto-reload settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Turn off auto-reload from dialog
  const handleTurnOffAutoReload = async () => {
    setIsSavingSettings(true);
    try {
      await updateExtraUsageSettings({ autoReloadEnabled: false });
      toast.success("Auto-reload disabled");
      setShowAutoReloadDialog(false);
    } catch (error) {
      console.error("Failed to turn off auto-reload:", error);
      toast.error("Failed to turn off auto-reload");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Save monthly spending limit handler
  const handleSaveSpendingLimit = async (limitDollars: number | null) => {
    setIsSavingSettings(true);
    try {
      await updateExtraUsageSettings({
        monthlyCapDollars: limitDollars,
      });
      toast.success(
        limitDollars ? "Spending limit updated" : "Spending limit removed",
      );
      setShowSpendingLimitDialog(false);
    } catch (error) {
      console.error("Failed to save spending limit:", error);
      toast.error("Failed to update spending limit");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const balanceDollars = extraUsageSettings?.balanceDollars ?? 0;
  const balancePoints = extraUsageSettings?.balancePoints ?? 0;
  const autoReloadEnabled = extraUsageSettings?.autoReloadEnabled ?? false;
  const autoReloadDisabledReason = extraUsageSettings?.autoReloadDisabledReason;
  const monthlyCapDollars = extraUsageSettings?.monthlyCapDollars;
  const monthlySpentDollars = extraUsageSettings?.monthlySpentDollars ?? 0;
  const effectiveCapDollars = monthlyCapDollars;

  // Get color class based on usage percentage (matches UsageTab)
  const getUsageColorClass = (percentage: number): string => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-orange-500";
    return "bg-primary";
  };

  return (
    <>
      <section
        data-testid="extra-usage-section"
        className="flex flex-col gap-6"
      >
        {/* Plans — subscribe/upgrade via LemonSqueezy */}
        {(() => {
          const currentTier: "free" | "pro" | "ultra" = activeSubscription
            ? activeSubscription.tier === "ultra"
              ? "ultra"
              : "pro"
            : "free";
          const PLANS = [
            {
              tier: "free" as const,
              name: "Free",
              price: "$0",
              cadence: "",
              features: [
                "10 questions per day",
                "1 full agent run each month",
                "Build, Create & Secure",
                "Isolated cloud sandbox",
              ],
            },
            {
              tier: "pro" as const,
              name: "Pro",
              price: "$39",
              cadence: "/mo",
              features: [
                "500,000 credits every month",
                "All models & capabilities",
                "Unlimited chats & projects",
                "Priority sandboxes",
              ],
            },
            {
              tier: "ultra" as const,
              name: "Max",
              price: "$129",
              cadence: "/mo",
              features: [
                "1,800,000 credits every month",
                "Personal API keys",
                "Highest limits & priority",
                "Early access to new tools",
              ],
            },
          ];
          const rank = { free: 0, pro: 1, ultra: 2 } as const;
          return (
            <div className="w-full flex flex-col gap-3 border-b border-border pb-6">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">Plan</p>
                <p className="text-sm text-muted-foreground">
                  {currentTier === "free"
                    ? "You're on the free plan. Upgrade for monthly credits and all features across build, image, and security."
                    : `You're on ${currentTier === "ultra" ? "Max" : "Pro"} — thanks for supporting RIFT.`}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {PLANS.map((plan) => {
                  const isCurrent = plan.tier === currentTier;
                  const isUpgrade = rank[plan.tier] > rank[currentTier];
                  const featured = plan.tier === "pro";
                  return (
                    <div
                      key={plan.tier}
                      className={`relative flex flex-col rounded-xl border p-4 ${
                        isCurrent
                          ? "border-primary/60 bg-primary/[0.06]"
                          : featured
                            ? "border-primary/30 bg-card"
                            : "border-border bg-card"
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                          Current
                        </span>
                      )}
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-semibold">
                          {plan.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {plan.price}
                          </span>
                          {plan.cadence}
                        </span>
                      </div>
                      <ul className="mt-3 flex flex-1 flex-col gap-1.5">
                        {plan.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-1.5 text-[12.5px] text-muted-foreground"
                          >
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {plan.tier !== "free" && isUpgrade && (
                        <Button
                          variant={featured ? "default" : "outline"}
                          size="sm"
                          className="mt-4"
                          disabled={isUpgrading !== null}
                          onClick={() => handleUpgrade(plan.tier)}
                          aria-label={`Upgrade to ${plan.name}`}
                        >
                          {isUpgrading === plan.tier
                            ? "Redirecting…"
                            : currentTier === "free"
                              ? `Upgrade to ${plan.name}`
                              : `Switch to ${plan.name}`}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Toggle Row */}
        <div className="w-full min-w-0 flex flex-row gap-x-8 gap-y-3 justify-between items-center">
          <div className="w-full min-w-0 flex flex-row gap-4 items-center">
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className="text-sm">
                Turn on auto-reload to top up tokens automatically when you run
                low.{" "}
                <a
                  href="https://help.rift.co/en/articles/13455916-extra-usage-for-paid-rift-plans"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline underline underline-offset-[3px] text-muted-foreground hover:text-foreground"
                  aria-label="Learn more about extra usage"
                >
                  Learn more
                </a>
              </p>
            </div>
          </div>
          <Switch
            checked={userCustomization?.extra_usage_enabled ?? false}
            onCheckedChange={handleToggleExtraUsage}
            disabled={isTogglingExtraUsage}
            aria-label="Toggle extra usage"
          />
        </div>

        {/* Enabled State - Show additional controls */}
        {userCustomization?.extra_usage_enabled && (
          <>
            {/* Monthly Spending Progress */}
            {effectiveCapDollars != null && effectiveCapDollars > 0 && (
              <div className="w-full flex flex-col gap-2">
                <div className="w-full flex flex-row gap-x-8 gap-y-3 justify-between items-center flex-wrap">
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <p className="text-sm">
                      ${monthlySpentDollars.toFixed(2)} spent
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      Resets{" "}
                      {new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + 1,
                        1,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 md:flex-1 md:max-w-xl">
                    <div className="flex-1">
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full transition-all duration-500 ${getUsageColorClass((monthlySpentDollars / effectiveCapDollars) * 100)}`}
                          style={{
                            width: `${Math.min(100, (monthlySpentDollars / effectiveCapDollars) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-nowrap text-right">
                      {Math.min(
                        100,
                        Math.round(
                          (monthlySpentDollars / effectiveCapDollars) * 100,
                        ),
                      )}
                      % used
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Spending Limit Row */}
            <div className="w-full flex flex-row gap-x-8 gap-y-3 justify-between items-center">
              <div className="flex flex-col gap-1.5 min-w-0">
                <p className="text-sm">
                  {effectiveCapDollars != null
                    ? `$${effectiveCapDollars.toFixed(2)}`
                    : "Unlimited"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Monthly spending limit
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSpendingLimitDialog(true)}
                disabled={isSavingSettings}
                className="min-w-[5rem]"
                aria-label="Adjust spending limit"
                tabIndex={0}
              >
                Adjust
              </Button>
            </div>

            {/* Current Balance Row */}
            <div className="w-full flex flex-row gap-x-8 gap-y-3 justify-between items-center flex-wrap">
              <div className="flex flex-col gap-1.5 min-w-0">
                <p className="text-sm tabular-nums">
                  {formatTokens(balancePoints, { compact: false })} tokens
                </p>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Token balance
                  <span className="mx-1">·</span>
                  <button
                    type="button"
                    onClick={() => setShowAutoReloadDialog(true)}
                    className={
                      autoReloadEnabled
                        ? "text-green-500 underline hover:text-green-400"
                        : "text-red-500 underline hover:text-red-400"
                    }
                    aria-label="Configure auto-reload"
                    tabIndex={0}
                  >
                    Auto-reload {autoReloadEnabled ? "on" : "off"}
                  </button>
                </p>
                {!autoReloadEnabled && autoReloadDisabledReason && (
                  <div
                    role="alert"
                    className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"
                  >
                    Auto-reload was turned off because your card kept failing
                    {`: ${autoReloadDisabledReason}`}. Update your payment
                    method, then turn auto-reload back on.
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/upgrade";
                }}
                className="min-w-[5rem]"
                aria-label="Add credits"
                tabIndex={0}
              >
                Add credits
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Dialogs */}
      <TurnOffExtraUsageDialog
        open={showTurnOffDialog}
        onOpenChange={setShowTurnOffDialog}
        onConfirm={handleConfirmTurnOff}
        isLoading={isTogglingExtraUsage}
      />

      <AdjustSpendingLimitDialog
        open={showSpendingLimitDialog}
        onOpenChange={setShowSpendingLimitDialog}
        onSave={handleSaveSpendingLimit}
        isLoading={isSavingSettings}
        currentLimitDollars={monthlyCapDollars ?? null}
      />

      <AutoReloadDialog
        open={showAutoReloadDialog}
        onOpenChange={setShowAutoReloadDialog}
        onSave={handleSaveAutoReload}
        onTurnOff={handleTurnOffAutoReload}
        onCancel={() => setShowAutoReloadDialog(false)}
        isLoading={isSavingSettings}
        isEnabled={autoReloadEnabled}
        currentThresholdDollars={
          extraUsageSettings?.autoReloadThresholdDollars ?? null
        }
        currentAmountDollars={
          extraUsageSettings?.autoReloadAmountDollars ?? null
        }
      />
    </>
  );
};

export { ExtraUsageSection };
