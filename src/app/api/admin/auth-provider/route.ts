import { NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';

import { getActiveProvider, setActiveProvider } from '@/libs/auth-provider';
import { authentikAuth } from '@/libs/auth-nextauth';

async function isAuthenticated(): Promise<boolean> {
  try {
    const { userId } = await clerkAuth();
    if (userId) return true;
  } catch {
    // no clerk session
  }
  try {
    const session = await authentikAuth();
    if (session?.user?.id) return true;
  } catch {
    // no authentik session
  }
  return false;
}

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const current = await getActiveProvider();
  return NextResponse.json({ current, available: ['clerk', 'authentik'] });
}

export async function POST(req: Request) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { provider } = await req.json();

  if (!['clerk', 'authentik'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  await setActiveProvider(provider as 'clerk' | 'authentik');

  const signInUrl = provider === 'authentik' ? '/api/auth/authentik-signin' : '/sign-in';

  return NextResponse.json({
    success: true,
    provider,
    signInUrl,
    message: `Switched to ${provider}. Please sign out and sign back in.`,
  });
}
