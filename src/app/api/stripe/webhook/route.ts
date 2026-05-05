import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// IMPORTANT: do NOT set apiVersion here to avoid TS version conflicts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: undefined as any,
});

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      /**
       * Checkout completed (one-time or subscription creation)
       */
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // TODO: persist user subscription / payment state in DB
        // session.customer, session.subscription, session.customer_email

        console.log('Checkout completed:', {
          sessionId: session.id,
          customer: session.customer,
          subscription: session.subscription,
        });

        break;
      }

      /**
       * Subscription updated
       */
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log('Subscription updated:', {
          id: subscription.id,
          status: subscription.status,
        });

        // TODO: update DB subscription status

        break;
      }

      /**
       * Subscription deleted/canceled
       */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log('Subscription canceled:', {
          id: subscription.id,
        });

        // TODO: mark user as unsubscribed in DB

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
