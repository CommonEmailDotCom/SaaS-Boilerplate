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

  await setActiveProvider(provider);

  return NextResponse.json({
    success: true,
    provider,
    message: `Switched to ${provider}. Active immediately — no redeploy needed.`,
  });
}
