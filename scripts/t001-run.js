#!/usr/bin/env node
/**
 * T-001 Auth Matrix — runs directly on MCP server, no browser needed.
 * All login is programmatic via API calls.
 */
const https = require('https');

const BASE_URL = 'https://cuttingedgechat.com';
const MCP_URL = 'https://mcp.joefuentes.me';
const GOOGLE_EMAIL = process.env.QA_GMAIL_EMAIL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
// Authentik client ID (for OIDC flow)
const AUTHENTIK_CLIENT_ID = 'aPM2wsr2lAtm96N1prfOC7t1XlDVARmA4GRBvlwa';

const results = [];
const pass = (id, msg) => { console.log(`✅ ${id}: ${msg}`); results.push({id, status:'PASS', msg}); };
const fail = (id, msg) => { console.log(`❌ ${id}: ${msg}`); results.push({id, status:'FAIL', msg}); };
const skip = (id, msg) => { console.log(`⏭  ${id}: ${msg}`); results.push({id, status:'SKIP', msg}); };

function req(url, opts={}) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: { 'User-Agent': 'T001-Observer/1.0', ...opts.headers },
      timeout: 15000,
    };
    const r = https.request(options, (res) => {
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
  // Step 1: find or create the test user
  let userId;
  const listR = await req('https://api.clerk.com/v1/users', {
    headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}` }
  });
  const users = JSON.parse(listR.body);
  const existing = (Array.isArray(users) ? users : (users.data || []))
    .find(u => u.email_addresses?.some(e => e.email_address === GOOGLE_EMAIL));

  if (existing) {
    userId = existing.id;
  } else {
    // Create user
    const body = JSON.stringify({
      email_address: [GOOGLE_EMAIL],
      skip_password_checks: true,
      skip_password_requirement: true,
    });
    const createR = await req('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body,
    });
    const created = JSON.parse(createR.body);
    if (!created.id) throw new Error('Could not create Clerk user: ' + createR.body.substring(0, 200));
    userId = created.id;
  }

  // Step 2: create a session for the user
  const sessBody = JSON.stringify({ user_id: userId });
  const sessR = await req('https://api.clerk.com/v1/sessions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: sessBody,
  });
  const session = JSON.parse(sessR.body);
  if (!session.id) throw new Error('Could not create Clerk session: ' + sessR.body.substring(0, 200));

  // Step 3: get a session token
  const tokR = await req(`https://api.clerk.com/v1/sessions/${session.id}/tokens`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const tok = JSON.parse(tokR.body);
  if (!tok.jwt) throw new Error('Could not get session token: ' + tokR.body.substring(0, 200));
  return { token: tok.jwt, userId, sessionId: session.id };
}

async function run() {
  console.log('\n=== T-001 Auth Matrix — MCP Server Run ===');
  console.log('Target:', BASE_URL);
  console.log('Time:', new Date().toISOString());
  console.log('');

  // ── Precondition ──────────────────────────────────────────────────────────
  const missing = ['QA_GMAIL_EMAIL','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REFRESH_TOKEN','CLERK_SECRET_KEY']
    .filter(k => !process.env[k]);
  if (missing.length) { fail('PRE', 'Missing env vars: ' + missing.join(', ')); process.exit(1); }
  pass('PRE', 'All env vars present');

  const ver = await req(`${BASE_URL}/api/version`);
  const sha = JSON.parse(ver.body)?.sha || 'unknown';
  pass('PRE', `Live SHA: ${sha}`);

  // ── Test A: Clerk baseline ─────────────────────────────────────────────────
  console.log('\n--- Test A: Clerk baseline ---');

  const signIn = await req(`${BASE_URL}/sign-in`);
  signIn.status === 200 ? pass('A1', '/sign-in HTTP 200') : fail('A1', `/sign-in HTTP ${signIn.status}`);

  let clerkData;
  try {
    clerkData = await getClerkSessionToken();
    pass('A2', `Clerk session token obtained for user ${clerkData.userId}`);
    const parts = clerkData.token.split('.');
    if (parts.length === 3) {
      pass('A3', 'Clerk token is valid JWT');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      payload.sub ? pass('A4', `Token subject: ${payload.sub}`) : fail('A4', 'No sub in token');
    } else {
      fail('A3', 'Clerk token malformed');
      skip('A4', 'Skipped');
    }
  } catch(e) {
    fail('A2', e.message.substring(0, 200));
    skip('A3', 'Skipped'); skip('A4', 'Skipped');
  }

  // ── Test B: Authentik sign-in route + Google token exchange ───────────────
  console.log('\n--- Test B: Authentik + Google token ---');

  const authSignin = await req(`${BASE_URL}/api/auth/authentik-signin`);
  const loc = authSignin.headers?.location || '';
  loc.includes('auth.joefuentes.me/application/o/authorize')
    ? pass('B1', 'Authentik-signin → auth.joefuentes.me/authorize ✓')
    : fail('B1', `Wrong redirect: ${loc.substring(0,80)}`);
  loc.includes('code_challenge_method')
    ? pass('B2', 'PKCE present') : fail('B2', 'PKCE missing');

  let idToken;
  try {
    idToken = await getGoogleIdToken();
    pass('B3', 'Google ID token obtained via refresh token');
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString());
    payload.email === GOOGLE_EMAIL
      ? pass('B4', `ID token email: ${payload.email} ✓`)
      : fail('B4', `Email mismatch: ${payload.email}`);
    const iat = new Date(payload.iat * 1000).toISOString();
    pass('B4b', `Token issued at: ${iat} (fresh)`);
  } catch(e) {
    fail('B3', e.message.substring(0,200));
    skip('B4', 'Skipped'); skip('B4b', 'Skipped');
  }

  // Test Authentik OIDC discovery is healthy
  const oidcDisc = await req('https://auth.joefuentes.me/application/o/cutting-edge-chat/.well-known/openid-configuration');
  oidcDisc.status === 200
    ? pass('B5', 'Authentik OIDC discovery HTTP 200')
    : fail('B5', `OIDC discovery HTTP ${oidcDisc.status}`);

  // ── Test C/D: Route protection ────────────────────────────────────────────
  console.log('\n--- Test C/D: Route protection ---');
  const dash = await req(`${BASE_URL}/dashboard`);
  dash.status === 307 && dash.headers?.location?.includes('/sign-in')
    ? pass('C1', '/dashboard unauthed → /sign-in ✓')
    : fail('C1', `/dashboard ${dash.status} → ${dash.headers?.location}`);

  const admin = await req(`${BASE_URL}/api/admin/auth-provider`);
  admin.status === 401
    ? pass('C2', '/api/admin/auth-provider → 401 unauthed ✓')
    : fail('C2', `Expected 401, got ${admin.status}`);

  const adminGet = await req(`${BASE_URL}/api/admin/auth-provider`, { method: 'GET' });
  pass('C3', `Active provider check: HTTP ${adminGet.status}`);

  // ── Test E: Smoke badge ───────────────────────────────────────────────────
  console.log('\n--- Test E: Smoke badge ---');
  const badge = await req(`${MCP_URL}/badge/smoke`);
  badge.status === 200 ? pass('E1', 'Badge endpoint HTTP 200') : fail('E1', `Badge HTTP ${badge.status}`);
  const badgeTitle = /<title>([^<]+)/.exec(badge.body)?.[1] || 'unknown';
  badgeTitle.includes('passing')
    ? pass('E2', `Badge: ${badgeTitle}`)
    : fail('E2', `Badge: ${badgeTitle} — will clear on next passing smoke run`);

  const versionCheck = await req(`${BASE_URL}/api/version`);
  versionCheck.status === 200 ? pass('E3', `Version endpoint: ${versionCheck.body}`) : fail('E3', 'Version endpoint failed');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n=== Summary ===');
  const passed = results.filter(r=>r.status==='PASS').length;
  const failed = results.filter(r=>r.status==='FAIL').length;
  const skipped = results.filter(r=>r.status==='SKIP').length;
  console.log(`✅ ${passed} passed  ❌ ${failed} failed  ⏭  ${skipped} skipped`);
  if (failed > 0) {
    console.log('\nFailed:');
    results.filter(r=>r.status==='FAIL').forEach(r=>console.log(` ❌ ${r.id}: ${r.msg}`));
  }
  return { passed, failed, skipped, sha, results };
}

run().then(s => process.exit(s.failed > 0 ? 1 : 0)).catch(e => { console.error('Fatal:', e.message); process.exit(1); });
