import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { cleanupDemoData } from '../src/utils/cleanupDemoData.js';

dotenv.config({ path: '.env' });

const run = async () => {
  const prisma = new PrismaClient();
  try {
    await cleanupDemoData(prisma);
    console.log('Demo data cleanup completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

run();