import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRICE_ID;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
});

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing STRIPE_PRICE_ID' },
        { status: 500 }
      );
    }

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
      success_url: `${appUrl}/dashboard?success=true`,
      cancel_url: `${appUrl}/dashboard?canceled=true`,
      metadata: {
        userId,
      },
    });

    // IMPORTANT: Stripe sometimes returns null in edge misconfig cases
    if (!session?.url) {
      console.error('Stripe session missing URL:', session);

      return NextResponse.json(
        {
          error: 'Stripe did not return a checkout URL',
          sessionId: session?.id ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);

    return NextResponse.json(
      {
        error: error?.message ?? 'Checkout failed',
      },
      { status: 500 }
    );
  }
}
