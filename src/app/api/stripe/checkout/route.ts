import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getAuthProvider, getSession } from '@/libs/auth-provider';
import { apiErrorResponse } from '@/libs/api-error';
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
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = session;

    const body = await req.json();
    const priceId: string | undefined = body.priceId;
    const stripeLocale: Stripe.Checkout.SessionCreateParams.Locale
      = stripeLocaleMap[body.locale] ?? 'auto';

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const provider = await getAuthProvider();
    let finalOrgId = session.orgId;

    if (!finalOrgId) {
      const orgs = await provider.getUserOrgs(userId);

      if (orgs.length > 0) {
        finalOrgId = orgs[0]!.id;
      } else {
        const newOrg = await provider.createOrg(
          `Workspace-${userId.slice(0, 6)}`,
          userId,
        );
        finalOrgId = newOrg.id;
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
      // Get org name from provider for Stripe customer
      const orgName = (await provider.getUserOrgs(userId))
        .find(o => o.id === finalOrgId)?.name
        ?? `Workspace-${userId.slice(0, 6)}`;

      const customer = await stripe.customers.create({
        name: orgName,
        metadata: { orgId: finalOrgId, userId },
      });

      stripeCustomerId = customer.id;
      await upsertOrganization(finalOrgId, { stripeCustomerId });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
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

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    return apiErrorResponse(error);
  }
}
