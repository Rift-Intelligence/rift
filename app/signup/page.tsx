import type { Metadata } from "next";
import ZauthPageShell from "@/app/components/ZauthPageShell";
import AuthForm from "@/app/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign up | EYE",
  description: "Create your EYE account.",
};

export default function SignupPage() {
  return (
    <ZauthPageShell header={false} center>
      <AuthForm flow="signUp" />
    </ZauthPageShell>
  );
}
