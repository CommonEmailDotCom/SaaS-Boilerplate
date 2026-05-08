import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { upsertOrganization, getOrganizationByStripeCustomerId } from '@/libs/organization';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature');

  if (!sig) {
    return new NextResponse('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new NextResponse('Webhook signature error', { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Checkout completed ────────────────────────────────────────────────
      // At this point the subscription is created and the first payment
      // has succeeded. We sync the full subscription state into the DB.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const orgId = session.metadata?.orgId;
        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;

        if (!orgId) {
          console.error('checkout.session.completed: missing orgId in metadata', session.id);
          break;
        }

        if (!customerId || !subscriptionId) {
          console.error('checkout.session.completed: missing customer or subscription', session.id);
          break;
        }

        // Fetch full subscription to get price and period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await upsertOrganization(orgId, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeSubscriptionStatus: subscription.status,
          stripeSubscriptionPriceId: subscription.items.data[0]?.price.id ?? null,
          stripeSubscriptionCurrentPeriodEnd: subscription.current_period_end,
        });

        console.info(`checkout.session.completed: org ${orgId} synced`);
        break;
      }

      // ── Subscription updated (plan change, renewal, etc.) ─────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Prefer orgId from subscription metadata (set at checkout).
        // Fall back to looking up by Stripe customer ID.
        const orgId
          = subscription.metadata?.orgId
          ?? (await getOrganizationByStripeCustomerId(subscription.customer as string))?.id;

        if (!orgId) {
          console.error(`${event.type}: could not resolve orgId for customer`, subscription.customer);
          break;
        }

        await upsertOrganization(orgId, {
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripeSubscriptionStatus: subscription.status,
          stripeSubscriptionPriceId: subscription.items.data[0]?.price.id ?? null,
          stripeSubscriptionCurrentPeriodEnd: subscription.current_period_end,
        });

        console.info(`${event.type}: org ${orgId} subscription synced`);
        break;
      }

      // ── Subscription cancelled / expired ─────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const orgId
          = subscription.metadata?.orgId
          ?? (await getOrganizationByStripeCustomerId(subscription.customer as string))?.id;

        if (!orgId) {
          console.error('customer.subscription.deleted: could not resolve orgId', subscription.customer);
          break;
        }

        await upsertOrganization(orgId, {
          stripeSubscriptionStatus: 'canceled',
          stripeSubscriptionCurrentPeriodEnd: subscription.current_period_end,
        });

        console.info(`customer.subscription.deleted: org ${orgId} marked canceled`);
        break;
      }

      // ── Invoice paid (renewal) ────────────────────────────────────────────
      // Fired every billing cycle. Keep period end in sync.
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const orgId
          = subscription.metadata?.orgId
          ?? (await getOrganizationByStripeCustomerId(subscription.customer as string))?.id;

        if (!orgId) break;

        await upsertOrganization(orgId, {
          stripeSubscriptionStatus: subscription.status,
          stripeSubscriptionCurrentPeriodEnd: subscription.current_period_end,
        });

        console.info(`invoice.paid: org ${orgId} period end updated`);
        break;
      }

      // ── Invoice payment failed ────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const orgId
          = subscription.metadata?.orgId
          ?? (await getOrganizationByStripeCustomerId(subscription.customer as string))?.id;

        if (!orgId) break;

        await upsertOrganization(orgId, {
          stripeSubscriptionStatus: subscription.status, // 'past_due' or 'unpaid'
        });

        console.warn(`invoice.payment_failed: org ${orgId} status set to ${subscription.status}`);
        break;
      }

      default:
        console.info(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
