import { NextResponse } from 'next/server';

import { getSession } from '@/libs/auth-provider';
import { getOrganization } from '@/libs/organization';

export async function GET() {
  const session = await getSession();

  if (!session?.orgId) {
    return NextResponse.json({ isSubscribed: false });
  }

  const org = await getOrganization(session.orgId);
  const isSubscribed = org?.stripeSubscriptionStatus === 'active';

  return NextResponse.json({ isSubscribed, orgId: session.orgId });
}
