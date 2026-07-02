import type { Metadata } from "next";
import ZauthPageShell from "@/app/components/ZauthPageShell";

export const metadata: Metadata = {
  title: "Refund Policy | RIFT",
  description: "Refund Policy for RIFT token purchases.",
  openGraph: {
    title: "Refund Policy | RIFT",
    description: "Refund Policy for RIFT token purchases.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Refund Policy | RIFT",
    description: "Refund Policy for RIFT token purchases.",
  },
};

export const dynamic = "force-static";

export default function RefundPolicyPage() {
  return (
    <ZauthPageShell footer>
      <div className="px-4 py-12 pb-20 md:px-0">
        <div className="container mx-auto max-w-2xl space-y-6 rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-8 backdrop-blur-sm sm:px-8">
          <h1 className="mb-5 text-center text-3xl font-semibold text-[#f4f4f5]">
            RIFT Refund Policy
          </h1>

          <div className="mt-4 text-lg leading-relaxed text-card-foreground">
            <p className="mb-4">
              RIFT LLC (&quot;the Company&quot;) sells prepaid usage credits
              (&quot;tokens&quot;) on a pay-as-you-go basis. This policy
              explains when token purchases can be refunded.
            </p>

            <ol className="list-inside list-decimal">
              <li className="mb-3">
                <strong>Free tier:</strong> The free allowance (daily Ask
                messages and the one free Agent run) is provided at no cost, so
                there is nothing to refund.
              </li>
              <li className="mb-3">
                <strong>Unused tokens:</strong> If you have not consumed any
                tokens from a purchase, you may request a full refund of that
                purchase within <strong>14 days</strong> of the transaction.
              </li>
              <li className="mb-3">
                <strong>Consumed tokens:</strong> Tokens that have already been
                spent on Ask or Agent requests are non-refundable, as the
                underlying compute and model costs have already been incurred.
                Partially used purchases may be refunded on a pro-rata basis for
                the unused remainder, at the Company&apos;s discretion.
              </li>
              <li className="mb-3">
                <strong>Crypto payments:</strong> Cryptocurrency transactions
                are irreversible. Where a refund is approved for a crypto
                purchase, it will be credited back to your in-app token balance
                rather than returned on-chain.
              </li>
              <li className="mb-3">
                <strong>Failed runs:</strong> If a request fails on our side and
                no usable output is produced, the tokens (or free run) consumed
                by that request are automatically restored to your account; no
                action is required.
              </li>
              <li className="mb-3">
                <strong>How to request a refund:</strong> Email{" "}
                <a
                  href="mailto:support@riftsys.app"
                  className="text-primary hover:underline"
                >
                  support@riftsys.app
                </a>{" "}
                from the address on your account with your order details. We aim
                to respond within 5 business days. Approved refunds are returned
                to the original payment method where possible.
              </li>
              <li className="mb-3">
                <strong>Abuse &amp; chargebacks:</strong> We reserve the right
                to decline refunds for accounts that violate our Terms of
                Service, and to suspend accounts associated with fraudulent
                payments or chargebacks.
              </li>
              <li className="mb-3">
                <strong>Changes to this policy:</strong> RIFT LLC may update
                this Refund Policy at any time. Continued use of the Products
                after changes constitutes acceptance of the updated policy.
              </li>
            </ol>

            <p className="mt-4">
              This policy applies in addition to your statutory rights, which it
              does not limit where they apply.
            </p>
          </div>
        </div>
      </div>
    </ZauthPageShell>
  );
}
