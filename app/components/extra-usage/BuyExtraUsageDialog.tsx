"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bitcoin, CreditCard } from "lucide-react";
import {
  TOKEN_PACKAGES,
  MIN_CUSTOM_TOPUP_USD,
  bonusPointsForDollars,
  type TokenPackage,
} from "@/lib/billing/token-packages";
import { formatTokens } from "@/lib/billing/token-display";
import { POINTS_PER_DOLLAR } from "@/lib/rate-limit/token-bucket";
import { cn } from "@/lib/utils";

type BuyExtraUsageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase: (amountDollars: number) => Promise<void>;
  onCardPurchase?: (amountDollars: number) => Promise<void>;
  isLoading: boolean;
  title?: string;
  description?: string;
  lineItemLabel?: string;
};

const MAX_AMOUNT = 999_999;

const formatWithCommas = (value: string): string => {
  const cleanValue = value.replace(/,/g, "");
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const removeCommas = (value: string): string => value.replace(/,/g, "");

const totalTokensForDollars = (dollars: number): number =>
  dollars * POINTS_PER_DOLLAR + bonusPointsForDollars(dollars);

type PaymentMethod = "card" | "crypto";

type ContentProps = {
  onPurchase: (amountDollars: number) => Promise<void>;
  onCardPurchase?: (amountDollars: number) => Promise<void>;
  isLoading: boolean;
  onClose: () => void;
  title: string;
  description: string;
  lineItemLabel: string;
};

const BuyExtraUsageDialogContent = ({
  onPurchase,
  onCardPurchase,
  isLoading,
  title,
  description,
  lineItemLabel,
}: ContentProps) => {
  const [selected, setSelected] = useState<TokenPackage["id"] | "custom">(
    "plus",
  );
  const [customAmount, setCustomAmount] = useState<string>("50");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    onCardPurchase ? "card" : "crypto",
  );

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
    if (paymentMethod === "card" && onCardPurchase) {
      await onCardPurchase(amountDollars);
    } else {
      await onPurchase(amountDollars);
    }
  };

  const hasCard = !!onCardPurchase;

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

        {/* Payment method selector */}
        <div>
          {hasCard && (
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                aria-pressed={paymentMethod === "card"}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors",
                  paymentMethod === "card"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                <CreditCard className="h-4 w-4" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("crypto")}
                aria-pressed={paymentMethod === "crypto"}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors",
                  paymentMethod === "crypto"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                <Bitcoin className="h-4 w-4" />
                Crypto
              </button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {paymentMethod === "card"
              ? "You'll be redirected to Stripe for secure card payment."
              : "BTC, ETH, USDT… Tokens are credited after on-chain confirmation (usually a few minutes)."}
          </p>
        </div>

        <Button
          onClick={handlePurchase}
          disabled={isLoading || !isValidAmount}
          className="w-full h-11"
        >
          {isLoading
            ? "Processing…"
            : isValidAmount
              ? paymentMethod === "card"
                ? `Pay $${amountDollars} with card`
                : `Pay with crypto — ${formatTokens(totalTokens)} tokens`
              : "Buy tokens"}
        </Button>
      </div>
    </>
  );
};

const BuyExtraUsageDialog = ({
  open,
  onOpenChange,
  onPurchase,
  onCardPurchase,
  isLoading,
  title = "Buy tokens",
  description = "Top up your token balance. Bigger packs include bonus tokens.",
  lineItemLabel = "Tokens",
}: BuyExtraUsageDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <BuyExtraUsageDialogContent
            onPurchase={onPurchase}
            onCardPurchase={onCardPurchase}
            isLoading={isLoading}
            onClose={() => onOpenChange(false)}
            title={title}
            description={description}
            lineItemLabel={lineItemLabel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export { BuyExtraUsageDialog };
