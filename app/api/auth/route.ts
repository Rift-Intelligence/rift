 
const { fetchAction } = require("convex/nextjs") as {
  fetchAction: (
    action: string,
    args: unknown,
    options: { url: string; token?: string },
  ) => Promise<unknown>;
};
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return new Response("Invalid method", { status: 405 });
  }

  const { action, args } = (await request.json()) as {
    action: string;
    args: Record<string, unknown>;
  };

  if (action !== "auth:signIn" && action !== "auth:signOut") {
    return new Response("Invalid action", { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("__convexAuthJWT")?.value;
  const refreshToken = cookieStore.get("__convexAuthRefreshToken")?.value;

  if (action === "auth:signIn" && args.refreshToken !== undefined) {
    if (!refreshToken) {
      return new Response(JSON.stringify({ tokens: null }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    args.refreshToken = refreshToken;
  }

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
    const result = await fetchAction(action, args, {
      url: convexUrl,
      ...(token ? { token } : {}),
    });

    const response = new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });

    // Set auth cookies from result
    const resultObj = result as Record<string, unknown> | null;
    if (resultObj && "tokens" in resultObj) {
      const tokens = resultObj.tokens as
        | { token: string; refreshToken: string }
        | null
        | undefined;
      if (tokens) {
        response.headers.append(
          "Set-Cookie",
          `__convexAuthJWT=${tokens.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
        );
        response.headers.append(
          "Set-Cookie",
          `__convexAuthRefreshToken=${tokens.refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
        );
      } else {
        response.headers.append(
          "Set-Cookie",
          `__convexAuthJWT=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
        );
        response.headers.append(
          "Set-Cookie",
          `__convexAuthRefreshToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
        );
      }
    }

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
