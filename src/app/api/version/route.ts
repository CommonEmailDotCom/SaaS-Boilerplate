import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    sha: process.env.NEXT_PUBLIC_COMMIT_SHA ?? 'unknown',
    env: process.env.NODE_ENV,
  });
}
// pipeline test 20260508T021258
