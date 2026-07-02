import crypto from "crypto";

/**
 * Stateless, signed OAuth `state` parameter for the GitHub connect flow.
 *
 * Rather than persisting pending-authorization rows, we HMAC-sign a small
 * payload ({ userId, returnTo, expiry }) with a server-only secret and hand it
 * to GitHub as the `state`. On callback we verify the signature + expiry, which
 * both binds the flow to the initiating RIFT user (CSRF protection) and tells us
 * where to send them back — with no database round-trip.
 */

const TEN_MINUTES_MS = 10 * 60 * 1000;

function secret(): string {
  const s =
    process.env.GITHUB_OAUTH_STATE_SECRET ||
    process.env.CONVEX_SERVICE_ROLE_KEY;
  if (!s) {
    throw new Error(
      "GITHUB_OAUTH_STATE_SECRET (or CONVEX_SERVICE_ROLE_KEY) is required to sign GitHub OAuth state.",
    );
  }
  return s;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

interface StatePayload {
  u: string; // userId
  r: string; // returnTo (same-origin path)
  e: number; // expiry (epoch ms)
}

export function signState(userId: string, returnTo: string): string {
  const payload: StatePayload = {
    u: userId,
    r: returnTo,
    e: Date.now() + TEN_MINUTES_MS,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(
    crypto.createHmac("sha256", secret()).update(body).digest(),
  );
  return `${body}.${sig}`;
}

export function verifyState(
  state: string | null | undefined,
): { userId: string; returnTo: string } | null {
  if (!state) return null;
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;

  const expected = b64url(
    crypto.createHmac("sha256", secret()).update(body).digest(),
  );
  // Constant-time compare.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(fromB64url(body).toString()) as StatePayload;
    if (!payload.u || typeof payload.e !== "number") return null;
    if (Date.now() > payload.e) return null;
    return { userId: payload.u, returnTo: sanitizeReturnTo(payload.r) };
  } catch {
    return null;
  }
}

/** Only allow same-origin relative paths as the post-auth redirect target. */
export function sanitizeReturnTo(returnTo: string | null | undefined): string {
  if (!returnTo) return "/";
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return "/";
  return returnTo;
}
