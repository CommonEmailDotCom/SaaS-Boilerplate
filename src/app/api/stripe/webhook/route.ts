import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/models/db'; // adjust if your path differs
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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      await db
        .update(organizationSchema)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeSubscriptionStatus: 'active',
        })
        .where(eq(organizationSchema.stripeCustomerId, customerId));

      console.log('✅ Checkout completed + DB updated');
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;

      await db
        .update(organizationSchema)
        .set({
          stripeSubscriptionStatus: sub.status,
          stripeSubscriptionPriceId: sub.items.data[0]?.price.id,
          stripeSubscriptionCurrentPeriodEnd:
            sub.current_period_end,
        })
        .where(eq(organizationSchema.stripeSubscriptionId, sub.id));

      console.log('🔄 Subscription updated in DB');
      break;
    }

    case 'invoice.paid': {
      console.log('💰 Invoice paid');
      break;
    }
  }

  return NextResponse.json({ received: true });
}
