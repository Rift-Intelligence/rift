"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowRight } from "lucide-react";
import { RiftLogo } from "@/components/icons/rift-logo";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

// AppleIcon — restore alongside the Apple sign-in button once Apple is enabled.
// function AppleIcon() { ... }

/**
 * Auth — Google / Apple OAuth + email/password with an emailed verification
 * code (so fake / non-existent email addresses cannot create an account).
 */
export default function AuthForm({ flow }: { flow: "signIn" | "signUp" }) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<"form" | "verify">("form");
  const [pending, setPending] = React.useState<{
    email: string;
    password: string;
  } | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  const isSignUp = flow === "signUp";

  // Tick the resend cooldown down to zero.
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const oauth = async (provider: "google" | "apple") => {
    setError(null);
    try {
      await signIn(provider, { redirectTo: "/" });
    } catch {
      setError("Couldn't start sign-in. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    form.set("flow", flow);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      const res = await signIn("password", form);
      // With email verification, sign-up does NOT sign in immediately — a code
      // was emailed and must be entered. (`signingIn === false`)
      if (isSignUp && res && res.signingIn === false) {
        setPending({ email, password });
        setStep("verify");
        setSubmitting(false);
        return;
      }
      router.push("/");
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const isRateLimited = /too many|please wait|being sent right now/i.test(
        raw,
      );
      const isCredentialError =
        /invalid|account|secret|password|credential/i.test(raw);
      const isDisposable = /disposable/i.test(raw);
      setError(
        isDisposable
          ? "Disposable email addresses aren't allowed. Use a real inbox."
          : // Server-side OTP rate limit — the message is already user-facing.
            isRateLimited
            ? raw
            : isCredentialError
              ? isSignUp
                ? "Couldn't create the account. Check your details."
                : "Invalid email or password."
              : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pending) return;
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    form.set("email", pending.email);
    form.set("flow", "email-verification");
    try {
      await signIn("password", form);
      router.push("/");
    } catch {
      setError("That code didn't match. Check it and try again.");
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!pending || cooldown > 0) return;
    setError(null);
    setCooldown(60); // server still gates delivery; this just curbs spam clicks
    const form = new FormData();
    form.set("email", pending.email);
    form.set("password", pending.password);
    form.set("flow", "signUp");
    try {
      await signIn("password", form);
    } catch {
      /* ignore — a fresh code is sent if the address is valid */
    }
  };

  const inputCls =
    "mt-1.5 w-full rounded-lg border border-border bg-[#1b1e23] px-3 py-2.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-[#6e6e6e] focus:border-[#00d3f5] focus:ring-1 focus:ring-[#00d3f5]";
  const labelCls =
    "text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground";

  return (
    <div className="relative w-full max-w-[400px]">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-6">
          <RiftLogo size={72} />
        </div>
        <h1 className="font-display text-balance text-[2rem] lowercase leading-[0.95] tracking-tight text-foreground sm:text-[2.3rem]">
          {step === "verify"
            ? "verify your email"
            : isSignUp
              ? "create your account"
              : "welcome back"}
        </h1>
        <p className="mt-2 max-w-xs text-pretty text-[14px] leading-relaxed text-muted-foreground">
          {step === "verify"
            ? `Enter the 6-digit code we sent to ${pending?.email ?? "your inbox"}.`
            : isSignUp
              ? "Start running autonomous pentest ops in an isolated sandbox."
              : "Sign in to continue to your sessions and agent workspace."}
        </p>
      </div>

      {step === "verify" ? (
        <form
          onSubmit={handleVerify}
          className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <label className="block">
            <span className={labelCls}>Verification code</span>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="123456"
              className={`${inputCls} text-center font-mono tracking-[0.4em]`}
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
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#00d3f5] text-[13px] font-semibold uppercase tracking-[0.06em] text-[#0a0e10] transition-colors hover:bg-[#5fe6ff] disabled:opacity-60"
          >
            {submitting ? "Verifying…" : "Verify & continue"}
          </button>

          <div className="mt-4 flex items-center justify-between text-[12px] text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError(null);
              }}
              className="hover:text-foreground"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className="hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => oauth("google")}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-border bg-[#1b1e23] text-[13px] font-medium text-foreground transition-colors hover:bg-[#2c2e33]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            {/* Apple sign-in — re-enable once the Apple Developer account is set up.
            <button
              type="button"
              onClick={() => oauth("apple")}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-border bg-[#1b1e23] text-[13px] font-medium text-foreground transition-colors hover:bg-[#2c2e33]"
            >
              <AppleIcon />
              Continue with Apple
            </button>
            */}
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-[0.12em] text-[#6e6e6e]">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block">
              <span className={labelCls}>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                className={inputCls}
              />
            </label>

            <label className="mt-4 block">
              <span className={labelCls}>Password</span>
              <input
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={8}
                placeholder="••••••••"
                className={inputCls}
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
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#00d3f5] text-[13px] font-semibold uppercase tracking-[0.06em] text-[#0a0e10] transition-colors hover:bg-[#5fe6ff] disabled:opacity-60"
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
        </div>
      )}

      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#00d3f5] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to RIFT?{" "}
            <Link
              href="/signup"
              className="font-medium text-[#00d3f5] underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        )}
      </p>

      <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#6e6e6e]">
        No credit card · Cloud sandbox · Beta
      </p>
    </div>
  );
}
