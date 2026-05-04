import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/models/db';
import { organizationSchema } from '@/models/Schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('❌ Webhook signature failed:', err);
    return new NextResponse('Webhook Error', { status: 400 });
  }

  console.log('🔥 Stripe event:', event.type);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const customerId = session.customer as string | null;
      const subscriptionId = session.subscription as string | null;

      if (!customerId) {
        console.error('❌ Missing customerId');
        return NextResponse.json({ received: true });
      }

      // UPDATE
      await db
        .update(organizationSchema)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId ?? null,
          stripeSubscriptionStatus: 'active',
        })
        .where(eq(organizationSchema.stripeCustomerId, customerId));

      // VERIFY
      const existing = await db
        .select()
        .from(organizationSchema)
        .where(eq(organizationSchema.stripeCustomerId, customerId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(organizationSchema).values({
          id: crypto.randomUUID(),
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId ?? null,
          stripeSubscriptionStatus: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log('🆕 Org created');
      } else {
        console.log('✅ Org updated');
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return new NextResponse('Webhook failed', { status: 500 });
  }
}
