import type { Metadata } from "next";
import ZauthPageShell from "@/app/components/ZauthPageShell";
import AuthForm from "@/app/components/AuthForm";

export const metadata: Metadata = {
  title: "Log in | RIFT",
  description: "Sign in to RIFT.",
};

export default function LoginPage() {
  return (
    <ZauthPageShell header={false} center>
      <AuthForm flow="signIn" />
    </ZauthPageShell>
  );
}
