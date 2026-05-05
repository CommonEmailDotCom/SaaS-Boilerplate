import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';
import { PricingPlanList } from '@/utils/AppConfig';

export type OrgBillingState = typeof organizationSchema.$inferSelect;

/**
 * Get org billing state from DB by Clerk orgId.
 * Returns null if no row exists yet (free plan, never checked out).
 */
export async function getOrganization(orgId: string): Promise<OrgBillingState | null> {
  const rows = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Upsert org row keyed by Clerk orgId.
 * Uses onConflictDoUpdate for atomic upsert — safe under concurrent requests.
 */
export async function upsertOrganization(
  orgId: string,
  data: Partial<Omit<OrgBillingState, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  await db
    .insert(organizationSchema)
    .values({
      id: orgId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: organizationSchema.id,
      set: {
        ...data,
        updatedAt: new Date(),
      },
    });
}

/**
 * Look up org by Stripe customer ID.
 * Used in webhook handlers where we only have the Stripe customer.
 */
export async function getOrganizationByStripeCustomerId(
  stripeCustomerId: string,
): Promise<OrgBillingState | null> {
  const rows = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.stripeCustomerId, stripeCustomerId))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Derive a simple plan label from subscription state.
 * Use this for display — don't use it for access control.
 */
export function getPlanId(org: OrgBillingState | null): 'free' | 'premium' | 'enterprise' {
  if (!org || org.stripeSubscriptionStatus !== 'active') return 'free';

  const billingEnv = process.env.BILLING_PLAN_ENV ?? 'dev';

  for (const plan of Object.values(PricingPlanList)) {
    const priceId
      = billingEnv === 'prod'
        ? plan.prodPriceId
        : billingEnv === 'test'
          ? plan.testPriceId
          : plan.devPriceId;

    if (priceId && priceId === org.stripeSubscriptionPriceId) {
      return plan.id as 'free' | 'premium' | 'enterprise';
    }
  }

  return 'premium';
}
