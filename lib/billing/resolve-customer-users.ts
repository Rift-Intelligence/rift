/**
 * Previously mapped a Stripe customer to its user ids via an external
 * organization that owned the customer. it has been removed and billing is
 * deferred, so this resolves to nothing — subscription webhooks become no-ops
 * until billing is reworked on Convex.
 */
export async function resolveUserIdsFromCustomer(
  _customerId: string,
  _label?: string,
): Promise<{ userIds: string[]; orgId: string | null }> {
  return { userIds: [], orgId: null };
}
