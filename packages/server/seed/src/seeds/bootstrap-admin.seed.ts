import type { PrismaClient } from '@workspace/prisma/client';
import { id } from '../utils/id.js';
import { hashPassword } from '../utils/hash.js';

/**
 * One bootstrap platform admin so a fresh local environment has a way to
 * log in. Email defaults to the requesting user's own address; password
 * has no default — it must come from the environment (no weak fallback).
 */
export async function seedBootstrapAdmin(prisma: PrismaClient, platformAdminRoleId: string): Promise<void> {
  const email = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@example.com';
  const password = process.env['SEED_ADMIN_PASSWORD'];

  if (!password) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is required to seed the bootstrap admin user (no default password is generated).',
    );
  }

  console.log(`Seeding bootstrap admin (${email})…`);

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      id: id('usr'),
      email,
      userType: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      passwordHash,
      firstName: 'Platform',
      lastName: 'Admin',
      displayName: 'Platform Admin',
    },
    update: {
      userType: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
      // Keep the bootstrap password in sync with SEED_ADMIN_PASSWORD on every reseed,
      // so a known env value always yields a working local login (idempotent reset).
      passwordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: platformAdminRoleId } },
    create: {
      id: id('url'),
      userId: user.id,
      roleId: platformAdminRoleId,
      roleKey: 'platform_admin',
    },
    update: {},
  });

  console.log('  Bootstrap admin ready.');
}
