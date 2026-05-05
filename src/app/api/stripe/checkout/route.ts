import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const priceId: string | undefined = body.priceId;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing priceId' },
        { status: 400 }
      );
    }

    // -----------------------------
    // Clerk client (FIXED)
    // -----------------------------
    const clerk = await clerkClient();

    let finalOrgId = orgId;

    // If user has no org, create one
    if (!finalOrgId) {
      const org = await clerk.organizations.createOrganization({
        name: `Workspace-${userId.slice(0, 6)}`,
        createdBy: userId,
      });

      finalOrgId = org.id;
    }

    // -----------------------------
    // Stripe Checkout Session
    // -----------------------------
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId,
        orgId: finalOrgId ?? '',
      },
      subscription_data: {
        metadata: {
          userId,
          orgId: finalOrgId ?? '',
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
