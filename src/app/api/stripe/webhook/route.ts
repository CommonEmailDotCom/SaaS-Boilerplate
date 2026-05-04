import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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
      console.log('✅ Checkout completed:', session.id);
      break;
    }

    case 'invoice.paid': {
      console.log('💰 Invoice paid');
      break;
    }

    case 'customer.subscription.created': {
      console.log('📦 Subscription created');
      break;
    }
  }

  return NextResponse.json({ received: true });
}
