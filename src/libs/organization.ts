import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';

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
 * Safe to call multiple times — will create or update.
 */
export async function upsertOrganization(
  orgId: string,
  data: Partial<Omit<OrgBillingState, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const existing = await getOrganization(orgId);

  if (existing) {
    await db
      .update(organizationSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizationSchema.id, orgId));
  } else {
    await db.insert(organizationSchema).values({
      id: orgId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
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

  // Map Stripe price ID back to plan — falls through to 'premium' if unknown
  const { PLAN_ID, PricingPlanList } = require('@/utils/AppConfig');
  const billingEnv = process.env.BILLING_PLAN_ENV ?? 'dev';

  for (const plan of Object.values(PricingPlanList) as any[]) {
    const priceId
      = billingEnv === 'prod'
        ? plan.prodPriceId
        : billingEnv === 'test'
          ? plan.testPriceId
          : plan.devPriceId;

    if (priceId && priceId === org.stripeSubscriptionPriceId) {
      return plan.id;
    }
  }

  // Has active subscription but price ID not matched — treat as premium
  return 'premium';
}
