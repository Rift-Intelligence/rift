"use client";

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard, Pencil, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  TOKEN_PACKAGES,
  MIN_CUSTOM_TOPUP_USD,
  type TokenPackage,
} from "@/lib/billing/token-packages";
import { formatTokens } from "@/lib/billing/token-display";
import { cn } from "@/lib/utils";

type BuyExtraUsageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase: (amountDollars: number) => Promise<void>;
  isLoading: boolean;
  title?: string;
  description?: string;
  lineItemLabel?: string;
  paymentMethodMode?: "personal" | "checkout";
};

/** Format card brand name for display */
const formatCardBrand = (brand: string | null): string => {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1).replace(/_/g, " ");
};

const MAX_AMOUNT = 999_999;
const POINTS_PER_DOLLAR = 10_000;

/** Format number with commas (e.g., 1000 -> 1,000) */
const formatWithCommas = (value: string): string => {
  // Remove existing commas
  const cleanValue = value.replace(/,/g, "");
  // Format with commas (whole dollars only)
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/** Remove commas for parsing */
const removeCommas = (value: string): string => value.replace(/,/g, "");

/**
 * Volume-bonus tokens for a dollar amount — display mirror of the server's
 * bonusPointsForDollars (convex/extraUsageActions.ts). Kept in sync by the
 * shared package thresholds; used to preview custom-amount totals.
 */
const bonusPointsForDollars = (dollars: number): number => {
  const base = dollars * POINTS_PER_DOLLAR;
  let pct = 0;
  if (dollars >= 300) pct = 20;
  else if (dollars >= 100) pct = 10;
  else if (dollars >= 50) pct = 5;
  return Math.round((base * pct) / 100);
};

/** Total displayed tokens (base + bonus) for a dollar amount. */
const totalTokensForDollars = (dollars: number): number =>
  dollars * POINTS_PER_DOLLAR + bonusPointsForDollars(dollars);

type ContentProps = {
  onPurchase: (amountDollars: number) => Promise<void>;
  isLoading: boolean;
  onClose: () => void;
  title: string;
  description: string;
  lineItemLabel: string;
  paymentMethodMode: "personal" | "checkout";
};

const BuyExtraUsageDialogContent = ({
  onPurchase,
  isLoading,
  title,
  description,
  lineItemLabel,
  paymentMethodMode,
}: ContentProps) => {
  // Selected package id, or "custom" for a free-form amount.
  const [selected, setSelected] = useState<TokenPackage["id"] | "custom">(
    "plus",
  );
  const [customAmount, setCustomAmount] = useState<string>("50");
  const [paymentMethod, setPaymentMethod] = useState<{
    hasPaymentMethod: boolean;
    last4: string | null;
    brand: string | null;
  } | null>(null);
  const [loadingPaymentMethod, setLoadingPaymentMethod] = useState(
    paymentMethodMode === "personal",
  );

  const createBillingPortalSession = useAction(
    api.extraUsageActions.createBillingPortalSession,
  );
  const getPaymentStatus = useAction(api.extraUsageActions.getPaymentStatus);

  // Fetch payment method on mount
  useEffect(() => {
    if (paymentMethodMode === "checkout") {
      return;
    }

    getPaymentStatus({})
      .then((result) => {
        setPaymentMethod({
          hasPaymentMethod: result.hasPaymentMethod,
          last4: result.paymentMethodLast4,
          brand: result.paymentMethodBrand,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch payment method:", err);
      })
      .finally(() => {
        setLoadingPaymentMethod(false);
      });
  }, [getPaymentStatus, paymentMethodMode]);

  const handleEditPaymentMethod = async () => {
    try {
      const result = await createBillingPortalSession({
        flow: "payment_method",
        baseUrl: window.location.origin,
      });
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
        // Clear cached payment method so it refreshes when user returns
        setPaymentMethod(null);
      } else {
        toast.error(result.error || "Failed to open billing portal");
      }
    } catch {
      toast.error("Failed to open billing portal");
    }
  };

  const selectedPackage =
    selected === "custom"
      ? undefined
      : TOKEN_PACKAGES.find((p) => p.id === selected);

  const customParsed = parseInt(removeCommas(customAmount) || "0", 10);
  const amountDollars = selectedPackage
    ? selectedPackage.priceUsd
    : customParsed;

  const isValidAmount =
    !isNaN(amountDollars) &&
    amountDollars >= MIN_CUSTOM_TOPUP_USD &&
    amountDollars <= MAX_AMOUNT;
  const showMinAmountError =
    selected === "custom" &&
    customAmount !== "" &&
    !isNaN(customParsed) &&
    customParsed < MIN_CUSTOM_TOPUP_USD;
  const showMaxAmountError =
    selected === "custom" &&
    customAmount !== "" &&
    !isNaN(customParsed) &&
    customParsed > MAX_AMOUNT;

  const totalTokens = selectedPackage
    ? selectedPackage.totalTokens
    : isValidAmount
      ? totalTokensForDollars(amountDollars)
      : 0;

  const handlePurchase = async () => {
    if (!isValidAmount) return;
    await onPurchase(amountDollars);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-5 pt-4">
        <label className="block text-muted-foreground text-sm">
          {description}
        </label>

        {/* Package cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {TOKEN_PACKAGES.map((pkg) => {
            const active = selected === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelected(pkg.id)}
                aria-pressed={active}
                aria-label={`${pkg.name}: $${pkg.priceUsd} for ${formatTokens(pkg.totalTokens)} tokens`}
                className={cn(
                  "relative flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50",
                )}
              >
                {pkg.bonusPct > 0 && (
                  <span className="absolute right-2 top-2 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    +{pkg.bonusPct}%
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {pkg.name}
                </span>
                <span className="font-mono text-base font-semibold tabular-nums">
                  {formatTokens(pkg.totalTokens)}
                </span>
                <span className="text-xs text-muted-foreground">tokens</span>
                <span className="mt-1 text-sm font-medium">
                  ${pkg.priceUsd}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom amount */}
        <div>
          <button
            type="button"
            onClick={() => setSelected("custom")}
            aria-pressed={selected === "custom"}
            className={cn(
              "mb-2 text-sm underline-offset-2 transition-colors",
              selected === "custom"
                ? "text-primary underline"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Custom amount
          </button>
          {selected === "custom" && (
            <>
              <Input
                placeholder="$50"
                className="w-full"
                type="text"
                value={`$${formatWithCommas(customAmount)}`}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setCustomAmount(val);
                }}
                aria-label="Custom purchase amount"
                autoFocus
              />
              {showMinAmountError && (
                <p className="mt-2 text-sm text-red-500">
                  Minimum amount is ${MIN_CUSTOM_TOPUP_USD}
                </p>
              )}
              {showMaxAmountError && (
                <p className="mt-2 text-sm text-red-500">
                  Maximum amount is $999,999
                </p>
              )}
            </>
          )}
        </div>

        <div className="space-y-2">
          <hr className="mb-5 border-border" />
          <div className="flex justify-between text-sm">
            <span>{lineItemLabel}</span>
            <span className="tabular-nums">
              {formatTokens(totalTokens)} tokens
            </span>
          </div>
          <div className="flex justify-between pt-2 text-sm font-medium">
            <span>Total due</span>
            <span>
              ${formatWithCommas(String(isValidAmount ? amountDollars : 0))}
            </span>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between p-5 border border-border rounded-lg">
            <span className="font-medium text-sm">Payment method</span>
            <div className="flex items-center gap-3">
              {paymentMethodMode === "checkout" ? (
                <p className="text-sm flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Team billing account
                </p>
              ) : loadingPaymentMethod ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : paymentMethod?.hasPaymentMethod && paymentMethod.last4 ? (
                <p className="text-sm flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {formatCardBrand(paymentMethod.brand)} ending in{" "}
                  {paymentMethod.last4}
                </p>
              ) : (
                <p className="text-sm flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Link by Stripe
                </p>
              )}
              {paymentMethodMode === "personal" && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Edit payment method"
                  tabIndex={0}
                  onClick={handleEditPaymentMethod}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            onClick={handlePurchase}
            disabled={isLoading || !isValidAmount}
            className="w-full h-11"
          >
            {isLoading
              ? "Processing..."
              : isValidAmount
                ? `Buy ${formatTokens(totalTokens)} tokens`
                : "Buy tokens"}
          </Button>
        </div>
      </div>
    </>
  );
};

const BuyExtraUsageDialog = ({
  open,
  onOpenChange,
  onPurchase,
  isLoading,
  title = "Buy tokens",
  description = "Top up your token balance. Bigger packs include bonus tokens.",
  lineItemLabel = "Tokens",
  paymentMethodMode = "personal",
}: BuyExtraUsageDialogProps) => {
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <BuyExtraUsageDialogContent
            onPurchase={onPurchase}
            isLoading={isLoading}
            onClose={() => onOpenChange(false)}
            title={title}
            description={description}
            lineItemLabel={lineItemLabel}
            paymentMethodMode={paymentMethodMode}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export { BuyExtraUsageDialog };
