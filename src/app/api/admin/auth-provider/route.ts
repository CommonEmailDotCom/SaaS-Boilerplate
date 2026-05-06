import { NextResponse } from 'next/server';

import { getSession } from '@/libs/auth-provider';

const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN;
const COOLIFY_URL = process.env.COOLIFY_URL || 'http://10.0.1.5:8080';
const APP_UUID = 'tuk1rcjj16vlk33jrbx3c9d3';

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    current: process.env.AUTH_PROVIDER ?? 'clerk',
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

  if (!COOLIFY_API_TOKEN) {
    return NextResponse.json({ error: 'COOLIFY_API_TOKEN not configured' }, { status: 500 });
  }

  try {
    // Update AUTH_PROVIDER env var in Coolify
    const envRes = await fetch(`${COOLIFY_URL}/api/v1/applications/${APP_UUID}/envs`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${COOLIFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: 'AUTH_PROVIDER', value: provider }),
    });

    if (!envRes.ok) {
      const err = await envRes.json();
      return NextResponse.json({ error: 'Failed to update env var', details: err }, { status: 500 });
    }

    // Trigger a redeploy
    const deployRes = await fetch(`${COOLIFY_URL}/api/v1/deploy?uuid=${APP_UUID}&force=false`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${COOLIFY_API_TOKEN}` },
    });

    if (!deployRes.ok) {
      return NextResponse.json({ error: 'Env updated but redeploy failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      provider,
      message: `Switching to ${provider}. Redeployment triggered — takes ~5 minutes.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
