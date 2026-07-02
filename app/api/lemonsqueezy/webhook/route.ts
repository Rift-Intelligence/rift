import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { bonusPointsForDollars } from "@/lib/billing/token-packages";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Monthly "included" usage allowance per tier, in points (1 point = $0.0001).
// Pro: 500,000 = $50 of usage value; Max (ultra): 1,800,000 = $180.
const TIER_ALLOWANCE_POINTS: Record<string, number> = {
  pro: 500_000,
  ultra: 1_800_000,
};

// Subscription statuses that should hold the monthly allowance. `cancelled`
// keeps access until the paid period ends (LemonSqueezy then sends `expired`).
const ALLOWANCE_STATUSES = new Set([
  "active",
  "on_trial",
  "past_due",
  "cancelled",
]);

function variantToTier(variantId: string | undefined): string | null {
  if (!variantId) return null;
  if (variantId === process.env.LEMONSQUEEZY_PRO_VARIANT_ID) return "pro";
  if (variantId === process.env.LEMONSQUEEZY_MAX_VARIANT_ID) return "ultra";
  return null;
}

const str = (v: unknown): string | undefined =>
  v === null || v === undefined ? undefined : String(v);

/**
 * POST /api/lemonsqueezy/webhook
 *
 * Verifies the `X-Signature` (HMAC-SHA256 of the raw body with the webhook
 * signing secret), then:
 *  - `subscription_*` → upsert the subscription row + grant/revoke the monthly
 *    allowance (this drives the Pro/Max entitlement via getMyEntitlements).
 *  - `subscription_payment_success` → re-grant the allowance on each renewal.
 *  - `order_created` (our RIFT Credits top-up) → credit the prepaid balance.
 *
 * Configure in LemonSqueezy → Settings → Webhooks:
 *  - URL: https://<public-domain>/api/lemonsqueezy/webhook
 *  - Signing secret → LEMONSQUEEZY_WEBHOOK_SECRET
 *  - Events: subscription_created / _updated / _cancelled / _resumed /
 *    _expired / _paused / _unpaused, subscription_payment_success, order_created
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature =
    req.headers.get("X-Signature") ?? req.headers.get("x-signature");

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[LemonSqueezy] LEMONSQUEEZY_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    console.error("[LemonSqueezy] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: Record<string, string> };
    data?: { id?: string; type?: string; attributes?: Record<string, unknown> };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? "";
  const custom = payload.meta?.custom_data ?? {};
  const data = payload.data ?? {};
  const attrs = data.attributes ?? {};
  const serviceKey = process.env.CONVEX_SERVICE_ROLE_KEY!;

  // Resolve the RIFT user + tier for a subscription id: prefer the checkout
  // custom_data, fall back to the stored row (later events may omit it).
  async function resolveUserTier(
    lsSubscriptionId: string,
    variantId: string | undefined,
  ): Promise<{ userId: string; tier: string }> {
    let userId = custom.user_id ?? "";
    let tier = custom.tier ?? variantToTier(variantId) ?? "";
    if ((!userId || !tier) && lsSubscriptionId) {
      const existing = await convex.query(api.subscriptions.lookupByLsId, {
        serviceKey,
        lsSubscriptionId,
      });
      if (existing) {
        userId = userId || existing.userId;
        tier = tier || existing.tier;
      }
    }
    return { userId, tier };
  }

  try {
    // ---- One-time token top-up (RIFT Credits) ----
    if (eventName === "order_created") {
      // Only our credit orders carry kind=extra_usage_purchase; a subscription's
      // first payment also fires order_created and must be skipped here.
      if (custom.kind !== "extra_usage_purchase") {
        return NextResponse.json({
          received: true,
          ignored: "non-credit order",
        });
      }
      if (attrs.status !== "paid") {
        return NextResponse.json({ received: true, status: str(attrs.status) });
      }
      const userId = custom.user_id ?? "";
      const amountDollars = Number(custom.amount_dollars);
      if (!userId || !Number.isFinite(amountDollars) || amountDollars <= 0) {
        return NextResponse.json(
          { error: "Invalid metadata" },
          { status: 400 },
        );
      }
      const result = await convex.mutation(api.extraUsage.addCredits, {
        serviceKey,
        userId,
        amountDollars,
        bonusPoints: bonusPointsForDollars(amountDollars),
        idempotencyKey: `ls_${data.id}`,
        revenueSource: "extra_usage_purchase",
      });
      console.log(
        `[LemonSqueezy] order_created credited ${userId}: $${amountDollars}`,
        result.alreadyProcessed ? "(dup)" : "",
      );
      return NextResponse.json({ received: true });
    }

    // ---- Renewal payment → refresh the monthly allowance ----
    if (eventName === "subscription_payment_success") {
      const lsSubscriptionId = str(attrs.subscription_id) ?? "";
      const { userId, tier } = await resolveUserTier(
        lsSubscriptionId,
        undefined,
      );
      if (userId) {
        await convex.mutation(api.extraUsage.grantMonthlyAllowance, {
          serviceKey,
          userId,
          allowancePoints:
            TIER_ALLOWANCE_POINTS[tier] ?? TIER_ALLOWANCE_POINTS.pro,
        });
        console.log(
          `[LemonSqueezy] renewal allowance refreshed user=${userId}`,
        );
      }
      return NextResponse.json({ received: true });
    }

    // ---- Status-bearing subscription lifecycle events ----
    if (
      data.type === "subscriptions" &&
      eventName.startsWith("subscription_")
    ) {
      const lsSubscriptionId = str(data.id) ?? "";
      if (!lsSubscriptionId) {
        return NextResponse.json({ received: true, ignored: "no sub id" });
      }
      const status = str(attrs.status) ?? "";
      const variantId = str(attrs.variant_id);
      const { userId, tier: resolvedTier } = await resolveUserTier(
        lsSubscriptionId,
        variantId,
      );
      if (!userId) {
        console.error(
          "[LemonSqueezy] subscription event without resolvable user",
          eventName,
          lsSubscriptionId,
        );
        return NextResponse.json({ received: true, ignored: "no user" });
      }
      const tier = resolvedTier || "pro";

      await convex.mutation(api.subscriptions.upsertSubscriptionFromWebhook, {
        serviceKey,
        userId,
        lsSubscriptionId,
        lsCustomerId: str(attrs.customer_id),
        lsVariantId: variantId,
        lsOrderId: str(attrs.order_id),
        tier,
        status,
        renewsAt: str(attrs.renews_at),
        endsAt: str(attrs.ends_at),
      });

      const allowance = ALLOWANCE_STATUSES.has(status)
        ? (TIER_ALLOWANCE_POINTS[tier] ?? 0)
        : 0;
      await convex.mutation(api.extraUsage.grantMonthlyAllowance, {
        serviceKey,
        userId,
        allowancePoints: allowance,
      });

      console.log(
        `[LemonSqueezy] ${eventName} user=${userId} tier=${tier} status=${status} allowance=${allowance}`,
      );
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true, ignored: eventName });
  } catch (err) {
    console.error("[LemonSqueezy] webhook handler failed:", err);
    // 500 → LemonSqueezy retries the webhook.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
