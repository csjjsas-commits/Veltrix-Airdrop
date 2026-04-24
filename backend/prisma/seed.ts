import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { env } from '../src/utils/env.js';
import { seedDemoDatabase } from '../src/utils/seedDatabase.js';

dotenv.config({ path: '.env' });

const run = async () => {
  const prisma = new PrismaClient();
  try {
    if (env.NODE_ENV === 'production') {
      console.log('Prisma demo seed is disabled in production. Use `npm run seed:admin` para crear el primer administrador.');
      process.exit(0);
    }
    await seedDemoDatabase(prisma);
    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

run();

