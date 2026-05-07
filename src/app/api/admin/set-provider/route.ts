import { NextRequest, NextResponse } from 'next/server';
import { setActiveProvider } from '@/libs/auth-provider';

const VALID_PROVIDERS = ['clerk', 'authentik'] as const;
type Provider = typeof VALID_PROVIDERS[number];

function isValidProvider(value: unknown): value is Provider {
  return typeof value === 'string' && (VALID_PROVIDERS as readonly string[]).includes(value);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // --- Auth check ---
  const authHeader = req.headers.get('authorization') ?? '';
  const adminSecret = process.env.ADMIN_API_SECRET;

  if (!adminSecret) {
    console.error('[set-provider] ADMIN_API_SECRET env var is not set');
    return NextResponse.json({ ok: false, error: 'Server misconfiguration' }, { status: 500 });
  }

  const expectedBearer = `Bearer ${adminSecret}`;
  if (authHeader !== expectedBearer) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // --- Body parse ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const provider = (body as Record<string, unknown>)?.provider;

  if (!isValidProvider(provider)) {
    return NextResponse.json(
      { ok: false, error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` },
      { status: 400 }
    );
  }

  // --- Update active provider ---
  try {
    await setActiveProvider(provider);
  } catch (err) {
    console.error('[set-provider] setActiveProvider failed:', err);
    return NextResponse.json({ ok: false, error: 'Failed to update provider' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, provider }, { status: 200 });
}
