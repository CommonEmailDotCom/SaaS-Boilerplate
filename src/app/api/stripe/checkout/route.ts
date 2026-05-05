import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  try {
    // ✅ Clerk auth is async in your version
    const { userId, orgId: existingOrgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ allow priceId from request OR env fallback
    const body = await req.json().catch(() => ({}));
    const priceId =
      body?.priceId || process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing STRIPE_PRICE_ID or priceId in request' },
        { status: 500 }
      );
    }

    let orgId = existingOrgId;

    // (optional but keeps your earlier SaaS logic intact)
    if (!orgId) {
      const org = await clerkClient.organizations.createOrganization({
        name: `Workspace-${userId.slice(0, 6)}`,
        createdBy: userId,
      });

      orgId = org.id;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_APP_URL' },
        { status: 500 }
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

      success_url: `${appUrl}/dashboard?success=1`,
      cancel_url: `${appUrl}/pricing?canceled=1`,

      metadata: {
        userId,
        orgId,
      },

      subscription_data: {
        metadata: {
          userId,
          orgId,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe session missing URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);

    return NextResponse.json(
      { error: error.message ?? 'Checkout failed' },
      { status: 500 }
    );
  }
}
