import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Simple secret to prevent unauthorized access
const ADMIN_TOKEN = process.env.ADMIN_RECONCILE_TOKEN ?? 'change-me';

export async function GET(req: Request) {
  // Auth check
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any[] = [];

  // The 3 orphaned rows with UUID ids
  const orphanedRows = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.stripeSubscriptionStatus, 'active'));

  for (const row of orphanedRows) {
    // Skip rows that already look like Clerk org IDs
    if (row.id.startsWith('org_')) {
      results.push({
        id: row.id,
        status: 'skipped — already a Clerk org ID',
      });
      continue;
    }

    if (!row.stripeSubscriptionId) {
      results.push({
        id: row.id,
        status: 'skipped — no subscription ID',
      });
      continue;
    }

    try {
      // Fetch subscription from Stripe to get orgId from metadata
      const subscription = await stripe.subscriptions.retrieve(
        row.stripeSubscriptionId,
      );

      const orgId = subscription.metadata?.orgId;

      if (!orgId) {
        results.push({
          id: row.id,
          subscriptionId: row.stripeSubscriptionId,
          status: 'no orgId in Stripe metadata — cannot reconcile',
        });
        continue;
      }

      // Check if a row with this orgId already exists
      const existing = await db
        .select()
        .from(organizationSchema)
        .where(eq(organizationSchema.id, orgId))
        .limit(1);

      if (existing.length > 0) {
        // Merge — update existing row with stripe data and delete orphan
        await db
          .update(organizationSchema)
          .set({
            stripeCustomerId: row.stripeCustomerId,
            stripeSubscriptionId: row.stripeSubscriptionId,
            stripeSubscriptionStatus: row.stripeSubscriptionStatus,
            stripeSubscriptionPriceId: subscription.items.data[0]?.price.id ?? null,
            stripeSubscriptionCurrentPeriodEnd: subscription.current_period_end,
            updatedAt: new Date(),
          })
          .where(eq(organizationSchema.id, orgId));

        // Delete the orphaned UUID row
        await db
          .delete(organizationSchema)
          .where(eq(organizationSchema.id, row.id));

        results.push({
          oldId: row.id,
          newId: orgId,
          status: 'merged into existing org row and deleted orphan',
        });
      } else {
        // No existing row — just update the id
        await db
          .update(organizationSchema)
          .set({
            stripeSubscriptionPriceId: subscription.items.data[0]?.price.id ?? null,
            stripeSubscriptionCurrentPeriodEnd: subscription.current_period_end,
            updatedAt: new Date(),
          })
          .where(eq(organizationSchema.id, row.id));

        // Drizzle doesn't support updating primary keys directly,
        // so insert new row and delete old one
        await db.insert(organizationSchema).values({
          id: orgId,
          stripeCustomerId: row.stripeCustomerId,
          stripeSubscriptionId: row.stripeSubscriptionId,
          stripeSubscriptionStatus: row.stripeSubscriptionStatus,
          stripeSubscriptionPriceId: subscription.items.data[0]?.price.id ?? null,
          stripeSubscriptionCurrentPeriodEnd: subscription.current_period_end,
          createdAt: row.createdAt,
          updatedAt: new Date(),
        });

        await db
          .delete(organizationSchema)
          .where(eq(organizationSchema.id, row.id));

        results.push({
          oldId: row.id,
          newId: orgId,
          subscriptionId: row.stripeSubscriptionId,
          priceId: subscription.items.data[0]?.price.id ?? null,
          periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          status: 'reconciled ✅',
        });
      }
    } catch (err: any) {
      results.push({
        id: row.id,
        status: `error: ${err.message}`,
      });
    }
  }

  return NextResponse.json({ results }, { status: 200 });
}
