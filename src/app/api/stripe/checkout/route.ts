import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, clerkClient } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  try {
    const { userId, orgId: existingOrgId } = auth();

    if (!userId) {
      return NextResponse.json(
        { redirect: '/sign-in' },
        { status: 401 }
      );
    }

    let orgId = existingOrgId;

    // Create org if missing
    if (!orgId) {
      const org = await clerkClient.organizations.createOrganization({
        name: `Workspace-${userId.slice(0, 6)}`,
        createdBy: userId,
      });

      orgId = org.id;
    }

    const body = await req.json().catch(() => ({}));
    const priceId =
      body.priceId || process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing priceId' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,

      metadata: {
        orgId,
        userId,
      },

      subscription_data: {
        metadata: {
          orgId,
          userId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);

    return NextResponse.json(
      { error: error.message ?? 'Checkout failed' },
      { status: 500 }
    );
  }
}
