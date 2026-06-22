import { NextResponse } from "next/server";

// Local/Centrifugo sandbox is no longer supported.
// This route is kept to avoid 404s for any lingering callers.
export async function GET() {
  return NextResponse.json({ connections: [], onlineCount: 0 });
}
