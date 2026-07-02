import type { Metadata } from "next";
import Link from "next/link";
import ZauthPageShell from "@/app/components/ZauthPageShell";

export const metadata: Metadata = {
  title: "Pricing | RIFT",
  description:
    "RIFT pricing — start free, then Pro ($39/mo) or Max ($129/mo) for monthly credits across build, image, and security. Top up any time.",
  openGraph: {
    title: "Pricing | RIFT",
    description:
      "RIFT pricing — start free, then Pro ($39/mo) or Max ($129/mo) for monthly credits across build, image, and security.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pricing | RIFT",
    description:
      "RIFT pricing — start free, then Pro ($39/mo) or Max ($129/mo) for monthly credits across build, image, and security.",
  },
};

export const dynamic = "force-static";

type Plan = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Try every capability, no card required.",
    features: [
      "10 questions per day (Ask)",
      "1 full agent run each month",
      "Build, Create & Secure",
      "Isolated cloud sandbox",
    ],
  },
  {
    name: "Pro",
    price: "$39",
    cadence: "/ month",
    blurb: "For makers who ship every week.",
    features: [
      "Everything in Free",
      "500,000 credits every month",
      "All models & capabilities",
      "Unlimited chats & projects",
      "Priority sandboxes",
    ],
    highlight: true,
  },
  {
    name: "Max",
    price: "$129",
    cadence: "/ month",
    blurb: "For power users and small teams.",
    features: [
      "Everything in Pro",
      "1,800,000 credits every month",
      "Personal API keys",
      "Highest limits & priority",
      "Early access to new tools",
    ],
  },
];

const PACKS: { name: string; price: string; tokens: string; bonus?: string }[] =
  [
    { name: "Starter", price: "$20", tokens: "200,000 credits" },
    { name: "Plus", price: "$50", tokens: "525,000 credits", bonus: "+5%" },
    { name: "Pro", price: "$100", tokens: "1,100,000 credits", bonus: "+10%" },
    {
      name: "Scale",
      price: "$300",
      tokens: "3,600,000 credits",
      bonus: "+20%",
    },
  ];

export default function PricingPage() {
  return (
    <ZauthPageShell footer>
      <div className="px-4 py-12 pb-20 md:px-0">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-semibold text-[#f4f4f5]">
              Pricing
            </h1>
            <p className="text-sm text-muted-foreground">
              Start free. Every plan unlocks all three capabilities — build
              software, create images, and run security tests. Paid plans add a
              monthly pool of credits the agent spends as it works.
            </p>
          </div>

          {/* Plans */}
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-[14px] border p-6 ${
                  plan.highlight
                    ? "border-primary/50 bg-primary/[0.06]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-6 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#f4f4f5]">
                  {plan.name}
                </h2>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold text-[#f4f4f5]">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.cadence}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.blurb}
                </p>
                <ul className="mt-5 space-y-2 border-t border-white/10 pt-5 text-[14px] text-card-foreground">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="space-y-6 rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-8 text-card-foreground sm:px-8">
            {/* Credits top-up */}
            <section>
              <h2 className="mb-2 text-lg font-semibold text-[#f4f4f5]">
                Need more? Top up with credits
              </h2>
              <p className="mb-3 text-[15px] leading-relaxed">
                Run out mid-month, or prefer pay-as-you-go? Buy one-time credit
                packs. Credits never expire and are spent per request based on
                the model and length of each run — bigger jobs cost more, small
                ones cost less.
              </p>
              <div className="overflow-hidden rounded-lg border border-white/10">
                <table className="w-full text-left text-[15px]">
                  <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Pack</th>
                      <th className="px-4 py-2 font-medium">Price</th>
                      <th className="px-4 py-2 font-medium">You get</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PACKS.map((p) => (
                      <tr key={p.name} className="border-t border-white/10">
                        <td className="px-4 py-2.5">{p.name}</td>
                        <td className="px-4 py-2.5 tabular-nums">{p.price}</td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {p.tokens}
                          {p.bonus && (
                            <span className="ml-2 text-primary">{p.bonus}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Custom amounts from $10 to $999,999 are available at checkout.
                Larger packs include a volume bonus.
              </p>
            </section>

            {/* Payment */}
            <section>
              <h2 className="mb-2 text-lg font-semibold text-[#f4f4f5]">
                Payment
              </h2>
              <p className="text-[15px] leading-relaxed">
                Pay securely by card. Subscriptions renew monthly and can be
                cancelled any time; your credit balance and top-ups are shown in
                the app and consumed as you run requests. See our{" "}
                <Link
                  href="/refund-policy"
                  className="text-primary hover:underline"
                >
                  Refund Policy
                </Link>{" "}
                for details on refunds.
              </p>
            </section>
          </div>
        </div>
      </div>
    </ZauthPageShell>
  );
}
