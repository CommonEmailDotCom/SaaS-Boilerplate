// This endpoint has been removed. Use /api/admin/auth-provider instead.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint removed. Use /api/admin/auth-provider.' },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint removed. Use /api/admin/auth-provider.' },
    { status: 410 }
  );
}
