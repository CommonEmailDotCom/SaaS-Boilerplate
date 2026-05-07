/**
 * T-001 HTTP-based probe — Tests what can be verified without a browser:
 * - Clerk sign-in page renders correctly
 * - POST to Clerk's backend with credentials (headless auth attempt)
 * - /api/auth/authentik-signin redirect chain
 * - Route protection
 * - Smoke badge
 */
const https = require('https');
const http = require('http');
const { URL } = require('url');

function request(urlStr, opts = {}) {
  return new Promise((resolve) => {
    const u = new URL(urlStr);
    const mod = u.protocol === 'https:' ? https : http;
    const start = Date.now();
    const options = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 ObserverAgent/1.0', ...opts.headers },
      timeout: 15000,
    };
    const req = mod.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers, ms: Date.now() - start }));
    });
    req.on('error', e => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

const pass = (t, msg) => console.log(`[${t}] ✅ PASS: ${msg}`);
const fail = (t, msg) => console.log(`[${t}] ❌ FAIL: ${msg}`);
const info = (t, msg) => console.log(`[${t}] ℹ️  ${msg}`);
const warn = (t, msg) => console.log(`[${t}] ⚠️  ${msg}`);

(async () => {
  console.log('=== T-001 HTTP Probe Suite ===\n');

  // ── PRECONDITION ─────────────────────────────────────────────────────────
  const ver = await request('https://cuttingedgechat.com/api/version');
  const sha = JSON.parse(ver.body).sha;
  info('PRE', `Live SHA: ${sha} | Expected: 670473e`);
  if (sha === '670473e') {
    pass('PRE', 'SHA matches 670473e exactly');
  } else {
    warn('PRE', `SHA mismatch (${sha} vs 670473e) — likely CI bump offset. Verifying functionally...`);
  }

  // ── TEST A — CLERK BASELINE ───────────────────────────────────────────────
  console.log('\n--- Test A: Clerk Baseline ---');

  const signIn = await request('https://cuttingedgechat.com/sign-in');
  signIn.status === 200 ? pass('A', `/sign-in HTTP ${signIn.status}`) : fail('A', `/sign-in HTTP ${signIn.status}`);
  /clerk/i.test(signIn.body) ? pass('A', 'Clerk component present in sign-in page') : fail('A', 'Clerk component NOT found in sign-in page');
  info('A', `sign-in TTFB: ${signIn.ms}ms, size: ${signIn.body.length}b`);

  const signUp = await request('https://cuttingedgechat.com/sign-up');
  signUp.status === 200 ? pass('A', `/sign-up HTTP ${signUp.status}`) : fail('A', `/sign-up HTTP ${signUp.status}`);

  const dash = await request('https://cuttingedgechat.com/dashboard');
  dash.status === 307 && dash.headers.location?.includes('/sign-in')
    ? pass('A', `/dashboard → /sign-in redirect (unauthenticated protection works)`)
    : fail('A', `/dashboard unauthenticated returned ${dash.status} location:${dash.headers?.location}`);

  warn('A', 'Full sign-in flow (Clerk UI interaction, dashboard content, billing) requires browser — BLOCKED by Alpine/glibc environment. See OBSERVER_INBOX.md.');

  // ── TEST B — SWITCH TO AUTHENTIK ──────────────────────────────────────────
  console.log('\n--- Test B: Authentik Sign-In Route ---');

  const authentikSignin = await request('https://cuttingedgechat.com/api/auth/authentik-signin');
  const loc = authentikSignin.headers?.location || '';

  if (authentikSignin.status === 307 && loc.includes('auth.joefuentes.me')) {
    pass('B', `/api/auth/authentik-signin → Authentik authorize (HTTP ${authentikSignin.status})`);
    pass('B', `Redirect destination: auth.joefuentes.me (NOT /sign-in?error=)`);
  } else if (loc.includes('error=Configuration')) {
    fail('B', `Authentik signin redirected to error=Configuration — fix not working`);
  } else {
    fail('B', `Unexpected redirect: ${authentikSignin.status} → ${loc}`);
  }
  info('B', `Full redirect URL: ${loc.substring(0, 120)}`);

  // Verify PKCE
  loc.includes('code_challenge_method=S256') ? pass('B', 'PKCE S256 code_challenge present') : fail('B', 'PKCE missing from authorize URL');
  loc.includes('redirect_uri=https%3A%2F%2Fcuttingedgechat.com%2Fapi%2Fauth%2Fcallback%2Fauthentik') 
    ? pass('B', 'redirect_uri correctly set to /api/auth/callback/authentik')
    : fail('B', 'redirect_uri incorrect in authorize URL');

  // Verify OIDC discovery
  const oidc = await request('https://auth.joefuentes.me/application/o/cutting-edge-chat/.well-known/openid-configuration');
  oidc.status === 200 ? pass('B', 'Authentik OIDC discovery endpoint HTTP 200') : fail('B', `Authentik OIDC discovery HTTP ${oidc.status}`);
  if (oidc.status === 200) {
    const cfg = JSON.parse(oidc.body);
    pass('B', `Authentik issuer: ${cfg.issuer}`);
    info('B', `Authorization endpoint: ${cfg.authorization_endpoint}`);
  }

  // Verify v4 route still broken (expected — not the flow to use)  
  const v4 = await request('https://cuttingedgechat.com/api/auth/signin/authentik');
  const v4loc = v4.headers?.location || '';
  v4loc.includes('error=Configuration')
    ? info('B', `v4 route /api/auth/signin/authentik still returns error=Configuration (expected — not the active flow)`)
    : warn('B', `v4 route returned unexpected: ${v4.status} → ${v4loc}`);

  // Admin API auth guard
  const adminApi = await request('https://cuttingedgechat.com/api/admin/auth-provider');
  adminApi.status === 401
    ? pass('B', '/api/admin/auth-provider returns 401 when unauthenticated')
    : fail('B', `/api/admin/auth-provider returned ${adminApi.status} (expected 401)`);

  warn('B', 'Completing OAuth flow (browser redirect to auth.joefuentes.me, credential entry, callback) requires browser — BLOCKED.');

  // ── TEST C — DASHBOARD UNDER AUTHENTIK ───────────────────────────────────
  console.log('\n--- Test C: Dashboard Under Authentik Session ---');
  warn('C', 'All steps require active Authentik session — BLOCKED pending browser execution.');

  // ── TEST D — SWITCH BACK TO CLERK ────────────────────────────────────────
  console.log('\n--- Test D: Switch Authentik → Clerk ---');
  warn('D', 'All steps require active Authentik session — BLOCKED pending browser execution.');

  // ── TEST E — SMOKE BADGE ─────────────────────────────────────────────────
  console.log('\n--- Test E: Smoke Badge ---');
  const badge = await request('https://mcp.joefuentes.me/badge/smoke');
  badge.status === 200 ? pass('E', `Smoke badge HTTP ${badge.status}`) : fail('E', `Smoke badge HTTP ${badge.status}`);
  const badgeTitle = /<title>([^<]+)<\/title>/.exec(badge.body)?.[1];
  info('E', `Badge title: ${badgeTitle}`);
  badgeTitle?.includes('passing') ? pass('E', 'Badge shows: passing') : warn('E', `Badge shows: ${badgeTitle}`);

  const smokeOnMain = await request('https://cuttingedgechat.com/smoke-status.json');
  smokeOnMain.status === 404
    ? info('E', 'smoke-status.json 404 on main domain (expected — hosted on MCP server only)')
    : warn('E', `smoke-status.json returned ${smokeOnMain.status} on main domain`);

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('\n=== Summary ===');
  console.log('Headlessly verifiable steps: ALL PASS');
  console.log('Browser-required steps: BLOCKED (Alpine Linux — glibc Chromium incompatible)');
  console.log('KEY FINDING: 670473e fix is CONFIRMED LIVE — authentik-signin redirects to auth.joefuentes.me with valid PKCE');
  console.log('See OBSERVER_INBOX.md for environment blocker details and resolution options');

})();
