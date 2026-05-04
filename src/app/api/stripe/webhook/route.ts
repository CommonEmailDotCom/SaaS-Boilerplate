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
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (!customerId) {
          console.error('❌ Missing Stripe customerId');
          break;
        }

        // Update org if it exists
        const updateResult = await db
          .update(organizationSchema)
          .set({
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId ?? null,
            stripeSubscriptionStatus: 'active',
          })
          .where(eq(organizationSchema.stripeCustomerId, customerId));

        console.log('♻️ Update attempt completed:', updateResult);

        // Verify if anything exists after update
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

          console.log('🆕 Organization created from Stripe checkout');
        } else {
          console.log('✅ Organization confirmed in DB');
        }

        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;

        const customerId = sub.customer as string;

        await db
          .update(organizationSchema)
          .set({
            stripeSubscriptionStatus: sub.status,
            stripeSubscriptionPriceId: sub.items.data[0]?.price.id ?? null,
            stripeSubscriptionCurrentPeriodEnd: sub.current_period_end,
          })
          .where(eq(organizationSchema.stripeCustomerId, customerId));

        console.log('🔄 Subscription updated');
        break;
      }

      case 'invoice.paid': {
        console.log('💰 Invoice paid');
        break;
      }

      case 'invoice.payment_failed': {
        console.log('⚠️ Invoice payment failed');
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}
