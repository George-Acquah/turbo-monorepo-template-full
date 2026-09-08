import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, env } from 'prisma/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema'),
  migrations: {
    path: path.join(__dirname, 'prisma', 'migrations'),
    seed: 'pnpm --filter @workspace/seed run seed',
  },
  // Prefer an unpooled connection for Migrate/CLI operations. DDL statements and
  // Prisma Migrate's own advisory locks need to land on the same physical
  // connection across statements — not guaranteed by a PgBouncer-style pooler
  // (e.g. Neon's `-pooler` endpoint) in transaction-pooling mode. The running
  // app (PrismaService, via @prisma/adapter-pg) is unaffected by this and keeps
  // using the pooled DATABASE_URL. Falls back to DATABASE_URL when no separate
  // direct URL is configured (e.g. local dev against a non-pooled Postgres).
  datasource: {
    url: process.env.DATABASE_DIRECT_URL || env('DATABASE_URL'),
  },
});
