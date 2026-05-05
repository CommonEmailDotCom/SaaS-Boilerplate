import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    sha: process.env.NEXT_PUBLIC_COMMIT_SHA ?? 'unknown',
    env: process.env.NODE_ENV,
    // Temporarily expose to debug which var name Coolify actually sets
    nixpacks_sha: process.env.NIXPACKS_GIT_COMMIT_SHA ?? 'not set',
    source_commit: process.env.SOURCE_COMMIT ?? 'not set',
    git_sha: process.env.GIT_SHA ?? 'not set',
    coolify_commit: process.env.COOLIFY_GIT_COMMIT_SHA ?? 'not set',
  });
}
