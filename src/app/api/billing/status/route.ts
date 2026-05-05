import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getOrganization } from '@/libs/organization';

export async function GET() {
  const { orgId } = await auth();

  if (!orgId) {
    return NextResponse.json({ isSubscribed: false });
  }

  const org = await getOrganization(orgId);
  const isSubscribed = org?.stripeSubscriptionStatus === 'active';

  return NextResponse.json({ isSubscribed, orgId });
}
