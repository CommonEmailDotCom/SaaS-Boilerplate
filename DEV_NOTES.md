# Dev Notes

Running notes on decisions, gotchas, and things to remember.

## Build System

**Custom Dockerfile** (not Nixpacks) — switched because Nixpacks copies all files before `npm ci`, busting the cache on every commit. The custom Dockerfile does:

1. `deps` stage: `COPY package*.json` → `npm ci` (cached unless package.json changes)
2. `builder` stage: copy deps → copy code → `npm run build`
3. `runner` stage: minimal Alpine image with only the standalone output

**Important:** Coolify injects `NODE_ENV=production` as a build arg which skips devDependencies. We override this with `ENV NODE_ENV=development` in the deps stage so all packages install correctly.

**Husky** `prepare` script removed from `package.json` — it runs `husky install` which fails in Docker since there's no `.git` directory.

## Coolify

- Build pack: **Dockerfile**
- Internal API reachable at `http://10.0.1.5:8080/api/v1`
- App UUID (SaaS): `tuk1rcjj16vlk33jrbx3c9d3`
- App UUID (MCP server): `a1fr37jiwehxbfqp90k4cvsw`
- Deployments triggered via MCP server `/trigger-deploy` endpoint (GitHub Actions can't reach Coolify API directly due to IP allowlist)

## Stripe

All test mode. Before going to production:
- Create separate price IDs for Premium and Enterprise
- Update `prodPriceId` values in `AppConfig.ts`
- Set `BILLING_PLAN_ENV=prod` in Coolify

Webhook events handled:
- `checkout.session.completed`
- `customer.subscription.created/updated/deleted`
- `invoice.paid`
- `invoice.payment_failed`

## Clerk

Multi-tenant via organizations. Every billing unit is a Clerk org. Users without an org are redirected to `/onboarding/organization-selection`.

`NEXT_PUBLIC_CLERK_SIGN_IN_URL` must be set — Clerk requires it explicitly.

## Database

Two Postgres instances in Coolify:
- `l5n69wbtnzjmraxc92p1y6zs` — used by SaaS app
- `el9hp2t3tainf20k2bnznhfl` — separate instance

The `organization` table uses Clerk `orgId` (`org_xxxx`) as the primary key. Earlier orphaned rows used random UUIDs — these were cleared when the correct architecture was put in place.

## MCP Server

Runs at `mcp.joefuentes.me`. Source in `my-mcp-server` repo. Uses OAuth PKCE flow for Claude.ai authentication.

The `/trigger-deploy` endpoint was added specifically for GitHub Actions since the Coolify API has an IP allowlist that blocks GitHub's runners. The MCP server is on the same Docker network as Coolify so it can reach the internal API.

If the MCP container IP changes after a redeploy, update the allowed IPs in Coolify security settings. Consider using the full subnet `10.0.1.0/24` to avoid this.

## Version Tracking

Git SHA is written to `.env.production` by the `set-version` GitHub Action on every push. Visible at `https://saas.joefuentes.me/api/version`. Used to verify which commit is running in production.
