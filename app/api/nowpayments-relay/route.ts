import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { bonusPointsForDollars } from "@/lib/billing/token-packages";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function sortedStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(sortedStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const entries = keys.map(
    (k) => `${JSON.stringify(k)}:${sortedStringify(obj[k])}`,
  );
  return `{${entries.join(",")}}`;
}

/**
 * POST /api/nowpayments-relay
 *
 * Single NowPayments IPN entry point shared across multiple products on the
 * same NowPayments account.
 *
 * Flow:
 *  1. Verify x-nowpayments-sig HMAC-SHA512.
 *  2. Fire-and-forget forward to NOWPAYMENTS_RELAY_URL (the other product's
 *     webhook handler) with the original body + signature intact so that
 *     system can verify independently.
 *  3. If order_id contains "::" it's a RIFT payment — credit the user's
 *     balance via Convex.
 *  4. Otherwise ack with 200 (the relay above handled it).
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-nowpayments-sig");

  // Forward to the other product's webhook FIRST — fire-and-forget, before any
  // RIFT-side verification. The receiving system (qed.llc) re-verifies the
  // HMAC with its own copy of the shared account secret, so we deliberately do
  // NOT gate forwarding on RIFT's own verification: a misconfigured RIFT secret
  // must never be able to starve the other product of its payment webhooks.
  // The original raw body + signature are passed through unchanged.
  const relayUrl = process.env.NOWPAYMENTS_RELAY_URL;
  if (relayUrl && signature) {
    fetch(relayUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nowpayments-sig": signature,
      },
      body: rawBody,
    }).catch((err) =>
      console.error("[NowPayments Relay] Forward failed:", relayUrl, err),
    );
  }

  if (!signature) {
    console.error("[NowPayments Relay] Missing x-nowpayments-sig header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    console.error("[NowPayments Relay] NOWPAYMENTS_IPN_SECRET not configured");
    return NextResponse.json(
      { error: "IPN secret not configured" },
      { status: 500 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha512", ipnSecret)
    .update(sortedStringify(payload))
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    console.error("[NowPayments Relay] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const status = String(payload.payment_status ?? "");
  const orderId = String(payload.order_id ?? "");
  const paymentId = String(payload.payment_id ?? payload.invoice_id ?? "");
  const amountDollars = Number(payload.price_amount);

  // RIFT order_id format: "<userId>::<suffix>".
  // If the separator is absent, this webhook belongs to the other product —
  // the relay above handled it; ack so NowPayments stops retrying.
  if (!orderId.includes("::")) {
    return NextResponse.json({ received: true, relayed: true });
  }

  const userId = orderId.split("::")[0];

  if (status !== "finished") {
    return NextResponse.json({ received: true, status });
  }

  if (!userId || !Number.isFinite(amountDollars) || amountDollars <= 0) {
    console.error("[NowPayments Relay] Invalid RIFT order metadata:", orderId);
    return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
  }

  const bonusPoints = bonusPointsForDollars(amountDollars);

  try {
    const result = await convex.mutation(api.extraUsage.addCredits, {
      serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
      userId,
      amountDollars,
      bonusPoints,
      idempotencyKey: `np_${paymentId}`,
      revenueSource: "extra_usage_purchase",
    });

    console.log(
      `[NowPayments Relay] Credited RIFT user ${userId}: $${amountDollars} (+${bonusPoints} bonus)`,
      result.alreadyProcessed ? "(already processed)" : "",
    );
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[NowPayments Relay] addCredits failed:", err);
    return NextResponse.json({ error: "Crediting failed" }, { status: 500 });
  }
}
