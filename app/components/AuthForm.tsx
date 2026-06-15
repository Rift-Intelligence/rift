"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { RiftLogo } from "@/components/icons/rift-logo";
import DottedWordmark from "./DottedWordmark";

/**
 * zauth-styled email/password auth form, backed by Convex Auth's Password
 * provider. `flow` switches between sign-in and sign-up.
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
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10 flex items-center gap-2.5">
        <RiftLogo size={28} className="text-terminal-green" />
        <DottedWordmark
          word="RIFT"
          animate={false}
          fill="#f4f4f5"
          className="h-[18px] w-auto"
        />
      </div>

      <h1 className="text-3xl font-normal tracking-tight text-[#f4f4f5]">
        {isSignUp ? (
          <>
            Create your{" "}
            <span className="display-emphasis text-[#6df4ff]">account</span>.
          </>
        ) : (
          <>
            Welcome{" "}
            <span className="display-emphasis text-[#6df4ff]">back</span>.
          </>
        )}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
        {isSignUp
          ? "Start mapping breaches before they open."
          : "Sign in to continue to your operations."}
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-[14px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
      >
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="operator@rift.sh"
            className="mt-1.5 w-full rounded-[10px] border border-white/10 bg-black/30 px-3 py-2.5 text-[#f4f4f5] outline-none transition-colors placeholder:text-[#52525b] focus:border-terminal-green/60"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">
            Password
          </span>
          <input
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={8}
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-[10px] border border-white/10 bg-black/30 px-3 py-2.5 text-[#f4f4f5] outline-none transition-colors placeholder:text-[#52525b] focus:border-terminal-green/60"
          />
        </label>

        {error && (
          <p className="mt-4 text-sm text-[#f87171]" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="mt-6 h-11 w-full rounded-[10px] bg-terminal-green text-black hover:bg-terminal-green/90"
        >
          {submitting
            ? "Please wait…"
            : isSignUp
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#a1a1aa]">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#f4f4f5] underline underline-offset-4"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to RIFT?{" "}
            <Link
              href="/signup"
              className="text-[#f4f4f5] underline underline-offset-4"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
