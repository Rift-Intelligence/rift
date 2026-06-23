"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowRight } from "lucide-react";
import { RiftMascot } from "./rift/RiftMascot";

/**
 * Email/password auth — Cursor / landing style.
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
    <div className="w-full max-w-[400px]">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-5">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div className="relative scale-[1.35]">
            <RiftMascot
              cell={5}
              variant="hero"
              className="drop-shadow-[0_8px_32px_rgba(255,255,255,0.15)]"
            />
          </div>
        </div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-[#e8e8e8] sm:text-[1.75rem]">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 max-w-xs text-pretty text-[14px] leading-relaxed text-[#858585]">
          {isSignUp
            ? "Start running autonomous pentest ops in an isolated sandbox."
            : "Sign in to continue to your sessions and agent workspace."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-[#3c3c3c] bg-[#252526] p-5 sm:p-6"
      >
        <label className="block">
          <span className="text-[12px] font-medium text-[#858585]">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="mt-1.5 w-full rounded-md border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2.5 text-[13px] text-[#e8e8e8] outline-none transition-colors placeholder:text-[#6e6e6e] focus:border-[#505050] focus:ring-1 focus:ring-[#505050]"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-[12px] font-medium text-[#858585]">
            Password
          </span>
          <input
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={8}
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-md border border-[#3c3c3c] bg-[#1e1e1e] px-3 py-2.5 text-[13px] text-[#e8e8e8] outline-none transition-colors placeholder:text-[#6e6e6e] focus:border-[#505050] focus:ring-1 focus:ring-[#505050]"
          />
        </label>

        {error ? (
          <p className="mt-4 text-[13px] text-[#f48771]" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#e8e8e8] text-[13px] font-medium text-[#1e1e1e] transition-opacity hover:opacity-90 disabled:opacity-60"
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

      <p className="mt-6 text-center text-[13px] text-[#858585]">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#e8e8e8] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to RIFT?{" "}
            <Link
              href="/signup"
              className="text-[#e8e8e8] underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        )}
      </p>

      <p className="mt-4 text-center text-[11px] text-[#6e6e6e]">
        No credit card · Cloud sandbox included · Beta access
      </p>
    </div>
  );
}
