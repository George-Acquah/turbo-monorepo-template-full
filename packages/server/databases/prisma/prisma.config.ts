// packages/database/prisma.config.ts

import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Multi-file schema directory (official Prisma recommendation)
  schema: path.join(__dirname, 'prisma', 'schema'),

  // Migrations MUST sit next to the file that defines the datasource
  migrations: {
    path: path.join(__dirname, 'prisma', 'migrations'),
  },

  datasource: {
    url: env('DATABASE_URL'),
  },
});
