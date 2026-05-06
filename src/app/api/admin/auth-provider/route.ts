import { NextResponse } from 'next/server';

import { getSession, getActiveProvider, setActiveProvider } from '@/libs/auth-provider';

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const current = await getActiveProvider();
  return NextResponse.json({
    current,
    available: ['clerk', 'authentik'],
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { provider } = await req.json();

  if (!['clerk', 'authentik'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  await setActiveProvider(provider as 'clerk' | 'authentik');

  // Tell the client which sign-in URL to redirect to after signing out
  const signInUrl = provider === 'authentik'
    ? '/api/auth/signin/authentik'
    : '/sign-in';

  return NextResponse.json({
    success: true,
    provider,
    signInUrl,
    message: `Switched to ${provider}. Please sign out and sign back in.`,
  });
}
