#!/usr/bin/env node
/**
 * T-001 Auth Matrix — runs directly on MCP server, no browser needed.
 * All login is programmatic via API calls.
 */
const https = require('https');
const http = require('http');

const BASE_URL = 'https://cuttingedgechat.com';
const MCP_URL = 'https://mcp.joefuentes.me';
const GOOGLE_EMAIL = process.env.QA_GMAIL_EMAIL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_FAPI = 'https://smashing-bison-72.clerk.accounts.dev';

const results = [];
const pass = (id, msg) => { console.log(`✅ ${id}: ${msg}`); results.push({id, status:'PASS', msg}); };
const fail = (id, msg) => { console.log(`❌ ${id}: ${msg}`); results.push({id, status:'FAIL', msg}); };
const skip = (id, msg) => { console.log(`⏭  ${id}: ${msg}`); results.push({id, status:'SKIP', msg}); };

function req(url, opts={}) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: { 'User-Agent': 'T001-Observer/1.0', ...opts.headers },
      timeout: 15000,
    };
    const r = mod.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    r.on('error', e => resolve({ status: 0, body: e.message, headers: {} }));
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, body: 'timeout', headers: {} }); });
    if (opts.body) r.write(opts.body);
    r.end();
  });
}

async function getGoogleIdToken() {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }).toString();
  const r = await req('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = JSON.parse(r.body);
  if (!json.id_token) throw new Error('No id_token: ' + r.body.substring(0, 200));
  return json.id_token;
}

async function getClerkSessionToken() {
  const body = new URLSearchParams({ identifier: GOOGLE_EMAIL, strategy: 'ticket' }).toString();
  const r = await req(`${CLERK_FAPI}/v1/client/sign_ins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
    },
    body,
  });
  const json = JSON.parse(r.body);
  const token = json?.client?.sessions?.[0]?.last_active_token?.jwt;
  if (!token) throw new Error('Clerk token API failed: ' + r.body.substring(0, 300));
  return token;
}

async function run() {
  console.log('\n=== T-001 Auth Matrix — MCP Server Run ===');
  console.log('Target:', BASE_URL);
  console.log('Time:', new Date().toISOString());
  console.log('');

  // ── Precondition: check env vars ─────────────────────────────────────────
  const missing = ['QA_GMAIL_EMAIL','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN','CLERK_SECRET_KEY']
    .filter(k => !process.env[k]);
  if (missing.length) {
    fail('PRE', 'Missing env vars: ' + missing.join(', '));
    process.exit(1);
  }
  pass('PRE', 'All env vars present');

  // ── Version check ─────────────────────────────────────────────────────────
  const ver = await req(`${BASE_URL}/api/version`);
  const sha = JSON.parse(ver.body)?.sha || 'unknown';
  pass('PRE', `Live SHA: ${sha}`);

  // ── Test A: Clerk baseline ─────────────────────────────────────────────────
  console.log('\n--- Test A: Clerk baseline ---');

  const signIn = await req(`${BASE_URL}/sign-in`);
  signIn.status === 200 ? pass('A1', '/sign-in HTTP 200') : fail('A1', `/sign-in HTTP ${signIn.status}`);

  let clerkToken;
  try {
    clerkToken = await getClerkSessionToken();
    pass('A2', 'Clerk testing token obtained');
  } catch(e) {
    fail('A2', 'Clerk token failed: ' + e.message);
  }

  // Verify the token is a valid JWT
  if (clerkToken) {
    const parts = clerkToken.split('.');
    parts.length === 3 ? pass('A3', 'Clerk token is valid JWT format') : fail('A3', 'Clerk token malformed');
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      payload.sub ? pass('A4', `Clerk token subject: ${payload.sub}`) : fail('A4', 'No sub in token');
    } catch(e) { fail('A4', 'Could not decode token payload'); }
  } else {
    skip('A3', 'Skipped — no token'); skip('A4', 'Skipped — no token');
  }

  // ── Test B: Authentik sign-in route ───────────────────────────────────────
  console.log('\n--- Test B: Authentik sign-in route ---');

  const authSignin = await req(`${BASE_URL}/api/auth/authentik-signin`);
  const loc = authSignin.headers?.location || '';
  loc.includes('auth.joefuentes.me/application/o/authorize')
    ? pass('B1', 'Authentik-signin → auth.joefuentes.me/authorize ✓')
    : fail('B1', `Wrong redirect: ${loc.substring(0,80)}`);
  loc.includes('code_challenge_method')
    ? pass('B2', 'PKCE present') : fail('B2', 'PKCE missing');

  // Test Google ID token exchange
  let idToken;
  try {
    idToken = await getGoogleIdToken();
    pass('B3', 'Google ID token obtained via refresh token');
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    payload.email === GOOGLE_EMAIL
      ? pass('B4', `ID token email matches: ${payload.email}`)
      : fail('B4', `Email mismatch: ${payload.email} vs ${GOOGLE_EMAIL}`);
  } catch(e) {
    fail('B3', 'Google token exchange failed: ' + e.message);
    skip('B4', 'Skipped — no ID token');
  }

  // Authentik OIDC with prompt=none + id_token_hint
  if (idToken) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: 'aPM2wsr2lAtm96N1prfOC7t1XlDVARmA4GRBvlwa', // Authentik client ID
      redirect_uri: `${BASE_URL}/api/auth/callback/authentik`,
      scope: 'openid email profile',
      id_token_hint: idToken,
      prompt: 'none',
    });
    const oidc = await req(`https://auth.joefuentes.me/application/o/authorize/?${params}`);
    const oidcLoc = oidc.headers?.location || '';
    if (oidcLoc.includes(BASE_URL) && !oidcLoc.includes('error')) {
      pass('B5', `Authentik OIDC silent auth → app callback ✓`);
    } else if (oidcLoc.includes('error') || oidc.status === 400) {
      fail('B5', `Authentik OIDC error: ${oidcLoc.substring(0,100)}`);
    } else {
      skip('B5', `Unexpected response: HTTP ${oidc.status} → ${oidcLoc.substring(0,80)}`);
    }
  } else {
    skip('B5', 'Skipped — no ID token');
  }

  // ── Test C/D: Route protection ────────────────────────────────────────────
  console.log('\n--- Test C/D: Route protection ---');
  const dash = await req(`${BASE_URL}/dashboard`);
  dash.status === 307 && dash.headers?.location?.includes('/sign-in')
    ? pass('C1', '/dashboard unauthed → /sign-in ✓')
    : fail('C1', `/dashboard returned ${dash.status} → ${dash.headers?.location}`);

  const admin = await req(`${BASE_URL}/api/admin/auth-provider`);
  admin.status === 401
    ? pass('C2', '/api/admin/auth-provider → 401 unauthed ✓')
    : fail('C2', `Expected 401, got ${admin.status}`);

  // ── Test E: Smoke badge ───────────────────────────────────────────────────
  console.log('\n--- Test E: Smoke badge ---');
  const badge = await req(`${MCP_URL}/badge/smoke`);
  badge.status === 200 ? pass('E1', 'Badge endpoint HTTP 200') : fail('E1', `Badge HTTP ${badge.status}`);
  const badgeTitle = /<title>([^<]+)/.exec(badge.body)?.[1] || 'unknown';
  badgeTitle.includes('passing')
    ? pass('E2', `Badge: ${badgeTitle}`)
    : fail('E2', `Badge: ${badgeTitle} — smoke-status.json needs a passing run`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n=== Summary ===');
  const passed = results.filter(r=>r.status==='PASS').length;
  const failed = results.filter(r=>r.status==='FAIL').length;
  const skipped = results.filter(r=>r.status==='SKIP').length;
  console.log(`✅ ${passed} passed  ❌ ${failed} failed  ⏭  ${skipped} skipped`);
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r=>r.status==='FAIL').forEach(r=>console.log(` ❌ ${r.id}: ${r.msg}`));
  }
  return { passed, failed, skipped, sha, results };
}

run().then(summary => {
  process.exit(summary.failed > 0 ? 1 : 0);
}).catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
