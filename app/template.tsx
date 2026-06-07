"use client";

import React from "react";

/**
 * Route-level transition. Next.js re-mounts `template.tsx` on every navigation
 * (unlike `layout.tsx`), so wrapping the page subtree here gives a global
 * page-enter animation — the reference site's `viewEnter` (fade + 8px rise).
 * Providers live in `layout.tsx` and are unaffected, so no state is lost.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-view-enter h-full">{children}</div>;
}
