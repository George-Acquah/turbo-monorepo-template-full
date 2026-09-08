// @workspace/prisma — Prisma/PostgreSQL infrastructure. Owns the schema,
// migrations, generated client, and the Nest PrismaService/PrismaModule.
// No repositories — those live in @workspace/{context}-persistence packages.
export * from './client';
export * from './modules';
export * from './providers';
export * from './utils';
export * from './constants';
