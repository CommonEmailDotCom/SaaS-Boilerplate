# Cutting Edge Chat

AI-powered custom chatbots for your website. This repository is the **business layer** — authentication, subscriptions, billing, and the customer dashboard. The chatbot product itself is a separate service.

## Stack

- **Framework**: Next.js 14, TypeScript
- **Auth**: Clerk (multi-tenant, org-based)
- **Billing**: Stripe (subscriptions, webhooks, billing portal)
- **Database**: PostgreSQL via Drizzle ORM
- **UI**: Tailwind CSS, Shadcn UI, Radix UI
- **Hosting**: Hetzner VPS via Coolify
- **i18n**: next-intl (English only)

## Architecture

```
saas.joefuentes.me     ← this repo (business layer)
├── Landing page
├── Sign up / sign in (Clerk)
├── Stripe checkout + webhooks
└── Customer dashboard

chatbot service         ← separate repo (product layer)
└── Embed widget, chat API, knowledge base
```

The two services communicate via API keys generated per org in this project.

## Local Development

```bash
npm install
cp .env.example .env.local   # fill in Clerk, Stripe, DB vars
npm run dev
```

Required env vars:

| Variable | Description |
|---|---|
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `DATABASE_URL` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_APP_URL` | App base URL (e.g. `https://saas.joefuentes.me`) |
| `BILLING_PLAN_ENV` | `dev`, `test`, or `prod` |

## Database

Drizzle ORM with PostgreSQL. Two tables:

- `organization` — billing state keyed by Clerk `orgId`
- `todo` — placeholder CRUD demo

```bash
npm run db:generate   # generate migrations
npm run db:migrate    # run migrations
npm run db:studio     # open Drizzle Studio
```

## Billing Flow

1. Unauthenticated user clicks **Get Started** on pricing
2. Redirected to sign-up with `redirect_url=/dashboard/checkout?priceId=xxx`
3. After sign-up → `/dashboard/checkout` auto-triggers Stripe checkout
4. Stripe webhook fires → `organization` row created/updated in DB
5. Dashboard reads `organization` row by Clerk `orgId`

Key files:
- `src/app/api/stripe/checkout/route.ts` — creates Stripe customer + checkout session
- `src/app/api/stripe/webhook/route.ts` — handles all subscription lifecycle events
- `src/libs/organization.ts` — single source of truth for org billing state

## Deployment

Hosted on Hetzner via **Coolify**. Auto-deploys on push to `main`.

**Deploy flow:**
1. Push to `main`
2. GitHub Action (`set-version.yml`) writes commit SHA to `.env.production` and commits
3. Action calls MCP server which triggers Coolify via internal API
4. Coolify builds with custom `Dockerfile` (~2-3 min with cache)
5. Verify: `https://saas.joefuentes.me/api/version`

**Build times:**
- First build after `package.json` changes: ~4-5 min
- Subsequent builds (code only): ~2-3 min

## MCP Server

A remote MCP server runs at `https://mcp.joefuentes.me` giving Claude.ai direct access to this repo, the database, and Coolify. Source: `github.com/CommonEmailDotCom/my-mcp-server`.

Tools available to Claude:
- `read_file`, `write_file`, `list_directory`, `delete_file`
- `run_command` — shell access in repo directory
- `query_postgres` — direct DB access
- `git_commit_push`, `git_pull`
- `coolify_list_deployments`, `coolify_deployment_logs`, `coolify_trigger_deploy`

## Pricing Plans

Defined in `src/utils/AppConfig.ts`:

| Plan | Price | Features |
|---|---|---|
| Free | $0/mo | 1 chatbot |
| Premium | $79/mo | 5 chatbots |
| Enterprise | $199/mo | 100 chatbots |

Price IDs are set per environment (`devPriceId`, `testPriceId`, `prodPriceId`). Currently Premium and Enterprise share the same dev price ID — create separate Stripe products before going to production.

## Key Design Decisions

- **Clerk `orgId` is the primary key** for the `organization` table — not a UUID
- **One org per checkout** — if a user has no org, one is created automatically
- **Billing portal redirect** — existing subscribers are sent to Stripe portal instead of a new checkout
- **Standalone Next.js output** — `output: 'standalone'` in `next.config.mjs` for Docker
- **French locale removed** from AppConfig — English only for now
