"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Drop-in replacement for the previous WorkOS `useAuth()` hook, backed by
 * Convex Auth. Returns the same `{ user, loading, entitlements }` shape the
 * app's components already consume.
 *
 * `user` exposes id/email/firstName/lastName/profilePictureUrl derived from the
 * Convex Auth users table (which stores a single `name` + `image`).
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  name: string | null;
}

export function useAuth(): {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  entitlements: string[];
} {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");

  const loading = isLoading || (isAuthenticated && viewer === undefined);

  let user: AuthUser | null = null;
  if (viewer) {
    const name = viewer.name ?? "";
    const parts = name.split(" ").filter(Boolean);
    user = {
      id: viewer._id,
      email: viewer.email ?? "",
      firstName: parts[0] ?? null,
      lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
      profilePictureUrl: viewer.image ?? null,
      name: name || null,
    };
  }

  // Entitlements were a WorkOS construct; billing/teams migration is deferred,
  // so expose an empty set for now (consumers treat this as "free tier").
  return { user, loading, isAuthenticated, entitlements: [] };
}
