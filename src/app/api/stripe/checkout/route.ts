import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    // ✅ Clerk auth (FIX: must await in newer versions)
    const { userId, orgId: existingOrgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { redirect: "/sign-in" },
        { status: 401 }
      );
    }

    let orgId = existingOrgId;

    // ✅ Create org if missing (FIX: clerkClient is async factory now)
    if (!orgId) {
      const client = await clerkClient();

      const org = await client.organizations.createOrganization({
        name: `Workspace-${userId.slice(0, 6)}`,
        createdBy: userId,
      });

      orgId = org.id;
    }

    // ✅ Get Stripe Price ID from frontend
    const body = await req.json();
    const priceId: string | undefined = body?.priceId;

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing STRIPE_PRICE_ID (priceId)" },
        { status: 400 }
      );
    }

    // ✅ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,

      // ✅ SaaS linking layer (critical for webhook reconciliation)
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
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Checkout session failed" },
      { status: 500 }
    );
  }
}
