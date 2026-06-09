"use server";

/**
 * The Stripe billing portal redirect previously resolved the customer via
 * the prior provider. it has been removed and billing is deferred, so this is inert:
 * callers surface the thrown message as a toast.
 */
export default async function redirectToBillingPortalAction(): Promise<
  string | null
> {
  throw new Error("Billing management is temporarily unavailable.");
}
