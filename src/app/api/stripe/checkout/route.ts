import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { upsertOrganization, getOrganization } from '@/libs/organization';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const priceId: string | undefined = body.priceId;

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    // ── Ensure org exists in Clerk ────────────────────────────────────────────
    const clerk = await clerkClient();
    let finalOrgId = orgId;

    if (!finalOrgId) {
      const org = await clerk.organizations.createOrganization({
        name: `Workspace-${userId.slice(0, 6)}`,
        createdBy: userId,
      });
      finalOrgId = org.id;
    }

    // ── Get or create Stripe Customer ─────────────────────────────────────────
    // Always reuse the same Stripe customer across checkouts for this org.
    let stripeCustomerId: string | undefined;

    const existingOrg = await getOrganization(finalOrgId);

    if (existingOrg?.stripeCustomerId) {
      // Reuse existing customer
      stripeCustomerId = existingOrg.stripeCustomerId;
    } else {
      // Create a new Stripe customer linked to this org
      const clerkOrg = await clerk.organizations.getOrganization({
        organizationId: finalOrgId,
      });

      const customer = await stripe.customers.create({
        name: clerkOrg.name,
        metadata: {
          orgId: finalOrgId,
          userId,
        },
      });

      stripeCustomerId = customer.id;

      // Persist customer ID immediately — before checkout completes —
      // so we have a record even if the user abandons the checkout.
      await upsertOrganization(finalOrgId, {
        stripeCustomerId,
      });
    }

    // ── Create Stripe Checkout Session ────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId,
        orgId: finalOrgId,
      },
      subscription_data: {
        metadata: {
          userId,
          orgId: finalOrgId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
