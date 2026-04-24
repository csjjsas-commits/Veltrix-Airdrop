import * as bcrypt from 'bcrypt';
import { PrismaClient, Prisma } from '@prisma/client';
import { env } from './env';

export const seedProductionDatabase = async (prisma: PrismaClient) => {
  console.log('Starting production database seed...');

  // Create or update admin user
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.ADMIN_NAME) {
    throw new Error('Missing required environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME');
  }

  const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: {
      name: env.ADMIN_NAME,
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      email: env.ADMIN_EMAIL,
      name: env.ADMIN_NAME,
      password: hashedPassword,
      role: 'ADMIN',
      points: 0
    }
  });

  console.log(`Admin user ready: ${adminUser.email}`);

  // Create AirdropConfig if it doesn't exist
  const existingConfig = await prisma.airdropConfig.findFirst();
  if (!existingConfig) {
    await prisma.airdropConfig.create({
      data: {
        totalAirdropPool: new Prisma.Decimal('10000000'),
        currentWeek: 1,
        totalCommunityPoints: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        isActive: true
      }
    });
    console.log('AirdropConfig created');
  } else {
    console.log('AirdropConfig already exists');
  }

  // Create SystemSettings if it doesn't exist
  const existingSettings = await prisma.systemSettings.findFirst();
  if (!existingSettings) {
    await prisma.systemSettings.create({
      data: {
        maintenanceMode: false,
        maxTasksPerUser: 20,
        tokenSymbol: 'VELX',
        defaultTaskDuration: 7
      }
    });
    console.log('SystemSettings created');
  } else {
    console.log('SystemSettings already exists');
  }

  console.log('Production database seed completed successfully');
};