import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, clerkClient } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  const { userId, orgId: existingOrgId } = auth();

  if (!userId) {
    return NextResponse.json(
      { redirect: '/sign-in' },
      { status: 401 },
    );
  }

  let orgId = existingOrgId;

  // ✅ Auto-create org if missing
  if (!orgId) {
    const org = await clerkClient.organizations.createOrganization({
      name: `Workspace-${userId.slice(0, 6)}`,
      createdBy: userId,
    });

    orgId = org.id;
  }

  const { priceId } = await req.json();

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

    // 🔥 CRITICAL LINK BETWEEN STRIPE AND YOUR DB
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
}
