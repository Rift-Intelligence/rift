import Link from "next/link";
import { redirect } from "next/navigation";
import { ConvexHttpClient } from "convex/browser";
import { ArrowRight, Gift } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import ZauthPageShell from "@/app/components/ZauthPageShell";
import DottedWordmark from "@/app/components/DottedWordmark";
import { RiftLogo } from "@/components/icons/rift-logo";
import {
  getReferralRewardConfig,
  isValidReferralCode,
} from "@/lib/referrals/config";
import { workos } from "@/app/api/workos";

export const runtime = "nodejs";

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const firstValue = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

const buildAuthHref = (
  searchParams: Record<string, string | string[] | undefined>,
) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }
    params.set(key, value);
  }

  const query = params.toString();
  return query ? `/signup/auth?${query}` : "/signup/auth";
};

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const getSafeDisplayName = (user: {
  firstName?: string | null;
  lastName?: string | null;
}) => {
  const parts = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : undefined;
};

const getReferralDisplayName = async (
  referralCode: string,
): Promise<string | undefined> => {
  try {
    const invite = await convex.query(api.referrals.getReferralInvite, {
      serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
      referralCode,
    });

    if (!invite?.active) return undefined;

    const referrer = await workos.userManagement.getUser(invite.referrerUserId);
    return getSafeDisplayName(referrer);
  } catch (error) {
    console.warn("[signup] Failed to resolve referral invite", {
      referralCode,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const referralCode =
    firstValue(params.referral_code) ?? firstValue(params.ref);

  if (!referralCode || !isValidReferralCode(referralCode)) {
    redirect(buildAuthHref(params));
  }

  const authHref = buildAuthHref({
    ...params,
    referral_code: referralCode,
  });
  const bonusUnits = getReferralRewardConfig().referredSignupBonusUnits;
  const bonusHeading =
    bonusUnits > 0
      ? `Sign up and get ${bonusUnits} extra free request${bonusUnits === 1 ? "" : "s"}`
      : "Sign up through a referral link";
  const referrerName = await getReferralDisplayName(referralCode);
  const referralLine = referrerName
    ? `You're signing up through ${referrerName}'s referral link. Create your account to redeem your starter requests.`
    : "You're signing up through a custom referral link. Create your account to redeem your starter requests.";

  return (
    <ZauthPageShell header={false} center>
      <div className="w-full max-w-xl">
        <div className="mb-14 flex items-center gap-2.5">
          <RiftLogo size={28} className="text-terminal-green" />
          <DottedWordmark
            word="RIFT"
            animate={false}
            fill="#f4f4f5"
            className="h-[18px] w-auto"
          />
        </div>

        <h1 className="text-4xl font-semibold tracking-normal text-[#f4f4f5] md:text-5xl">
          Create your account
        </h1>

        <div className="mt-8 rounded-[14px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="bg-background border-border flex size-10 shrink-0 items-center justify-center rounded-xl border">
              <Gift className="size-5" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold">{bonusHeading}</p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {referralLine}
              </p>
            </div>
          </div>
        </div>

        <Button asChild size="lg" className="mt-6 h-12 w-full text-base">
          <Link href={authHref}>
            Continue to sign up
            <ArrowRight className="size-4" />
          </Link>
        </Button>

        <p className="text-muted-foreground mt-8 text-center text-base">
          Already have an account?{" "}
          <Link
            className="text-foreground underline underline-offset-4"
            href="/login"
          >
            Log in
          </Link>
        </p>

        <p className="text-muted-foreground mx-auto mt-8 max-w-md text-center text-sm leading-relaxed">
          By continuing, you agree to the{" "}
          <Link
            className="underline underline-offset-4"
            href="/terms-of-service"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link className="underline underline-offset-4" href="/privacy-policy">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </ZauthPageShell>
  );
}
