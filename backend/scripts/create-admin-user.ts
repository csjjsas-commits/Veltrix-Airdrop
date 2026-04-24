import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { env } from '../src/utils/env.js';
import { createAdminUser } from '../src/utils/createAdminUser.js';

dotenv.config({ path: '.env' });

async function main() {
  const prisma = new PrismaClient();

  try {
    await createAdminUser(prisma);
    console.log('Admin user created/updated successfully');
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();