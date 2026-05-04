import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export async function POST(req: Request) {
  try {
    // ✅ FIX: auth() is async in App Router Clerk SDK
    const { userId, orgId: existingOrgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing priceId' },
        { status: 400 },
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

      success_url: successUrl,
      cancel_url: cancelUrl,

      // ✅ Critical fix: org auto-attach support
      metadata: {
        userId,
        orgId: existingOrgId ?? '',
      },

      client_reference_id: userId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);

    return NextResponse.json(
      { error: error.message ?? 'Internal Server Error' },
      { status: 500 },
    );
  }
}
