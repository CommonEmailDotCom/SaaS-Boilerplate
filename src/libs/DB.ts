import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { PHASE_PRODUCTION_BUILD } from 'next/dist/shared/lib/constants';
import { Client } from 'pg';

import * as schema from '@/models/Schema';

import { Env } from './Env';

let client;
let drizzle;

if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD && Env.DATABASE_URL) {
  // Production / development: use real Postgres and run migrations
  client = new Client({
    connectionString: Env.DATABASE_URL,
  });
  await client.connect();

  drizzle = drizzlePg(client, { schema });
  await migratePg(drizzle, {
    migrationsFolder: path.join(process.cwd(), 'migrations'),
  });
} else {
  // Build phase: use PGlite in-memory DB — skip migrations to avoid
  // PL/pgSQL DO blocks and other Postgres-specific syntax that PGlite
  // does not support. Migrations only need to run against real Postgres.
  const global = globalThis as unknown as { client: PGlite; drizzle: PgliteDatabase<typeof schema> };

  if (!global.client) {
    global.client = new PGlite();
    await global.client.waitReady;

    global.drizzle = drizzlePglite(global.client, { schema });

    // Only run migrations if we have no PL/pgSQL-incompatible statements
    // For now skip to avoid DO $$ blocks crashing PGlite during build
    try {
      await migratePglite(global.drizzle, {
        migrationsFolder: path.join(process.cwd(), 'migrations'),
      });
    } catch {
      // Silently ignore PGlite migration failures during build —
      // real migrations run against Postgres at runtime
    }
  }

  drizzle = global.drizzle;
}

export const db = drizzle;
