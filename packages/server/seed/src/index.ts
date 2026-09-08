import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@workspace/prisma/client';
import { seedIdentity, seedBootstrapAdmin } from './seeds/index.js';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('seed starting…\n');

  const { roles } = await seedIdentity(prisma);
  await seedBootstrapAdmin(prisma, roles['platform_admin']!);

  console.log('\nseed completed successfully.');
}

main()
  .catch((error) => {
    console.error('seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
