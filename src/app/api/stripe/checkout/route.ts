import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { upsertOrganization, getOrganization } from '@/libs/organization';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Map our app locales to Stripe's supported locale values
// https://stripe.com/docs/api/checkout/sessions/create#create_checkout_session-locale
const stripeLocaleMap: Record<string, Stripe.Checkout.SessionCreateParams.Locale> = {
  fr: 'fr',
  es: 'es',
  it: 'it',
  ja: 'ja',
  zh: 'zh',
  // hi: not supported by Stripe, falls back to auto
};

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const priceId: string | undefined = body.priceId;
    const stripeLocale: Stripe.Checkout.SessionCreateParams.Locale
      = stripeLocaleMap[body.locale] ?? 'auto';

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const clerk = await clerkClient();
    let finalOrgId = orgId;

    if (!finalOrgId) {
      const memberships = await clerk.users.getOrganizationMembershipList({ userId });

      if (memberships.data.length > 0) {
        finalOrgId = memberships.data[0]!.organization.id;
      } else {
        const org = await clerk.organizations.createOrganization({
          name: `Workspace-${userId.slice(0, 6)}`,
          createdBy: userId,
        });
        finalOrgId = org.id;
      }
    }

    const existingOrg = await getOrganization(finalOrgId);

    if (existingOrg?.stripeSubscriptionStatus === 'active' && existingOrg?.stripeCustomerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: existingOrg.stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        locale: stripeLocale === 'auto' ? 'auto' : stripeLocale,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    let stripeCustomerId: string | undefined;

    if (existingOrg?.stripeCustomerId) {
      stripeCustomerId = existingOrg.stripeCustomerId;
    } else {
      const clerkOrg = await clerk.organizations.getOrganization({
        organizationId: finalOrgId,
      });

      const customer = await stripe.customers.create({
        name: clerkOrg.name,
        metadata: { orgId: finalOrgId, userId },
      });

      stripeCustomerId = customer.id;
      await upsertOrganization(finalOrgId, { stripeCustomerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      locale: stripeLocale,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: { userId, orgId: finalOrgId },
      subscription_data: {
        metadata: { userId, orgId: finalOrgId },
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
