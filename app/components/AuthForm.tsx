"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowRight } from "lucide-react";

/**
 * Email/password auth — Rift 2 landing aesthetic.
 */
export default function AuthForm({ flow }: { flow: "signIn" | "signUp" }) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isSignUp = flow === "signUp";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    form.set("flow", flow);
    try {
      await signIn("password", form);
      router.push("/");
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const isCredentialError =
        /invalid|account|secret|password|credential/i.test(raw);
      setError(
        isCredentialError
          ? "Invalid email or password."
          : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-8 text-center sm:text-left">
        <p className="rift2-display text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {isSignUp ? "Get started" : "Welcome back"}
        </p>
        <h1 className="rift2-display mt-3 text-[clamp(1.75rem,5vw,2.25rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {isSignUp ? (
            <>
              Create your
              <br />
              <span className="rift2-serif italic text-foreground/90">
                account
              </span>
            </>
          ) : (
            <>
              Sign in to
              <br />
              <span className="rift2-serif italic text-foreground/90">
                RIFT
              </span>
            </>
          )}
        </h1>
        <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
          {isSignUp
            ? "Autonomous pentest ops in an isolated cloud sandbox."
            : "Continue to your sessions and agent workspace."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)] backdrop-blur-md sm:p-6"
      >
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="mt-2 w-full rounded-xl border border-border/70 bg-surface-1/80 px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-signal/50 focus:ring-1 focus:ring-signal/20"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Password
          </span>
          <input
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={8}
            placeholder="••••••••"
            className="mt-2 w-full rounded-xl border border-border/70 bg-surface-1/80 px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-signal/50 focus:ring-1 focus:ring-signal/20"
          />
        </label>

        {error ? (
          <p className="mt-4 text-[13px] text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? (
            "Please wait…"
          ) : (
            <>
              {isSignUp ? "Create account" : "Sign in"}
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted-foreground sm:text-left">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-signal/50"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to RIFT?{" "}
            <Link
              href="/signup"
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-signal/50"
            >
              Create an account
            </Link>
          </>
        )}
      </p>

      <p className="mt-4 text-center text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70 sm:text-left">
        No credit card · Cloud sandbox · Beta access
      </p>
    </div>
  );
}
