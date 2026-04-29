import { env } from './utils/env';
import app from './app';
import { initAnalyticsTable } from './services/analyticsService';
import prisma from './utils/prismaClient';
import { seedDemoDatabase } from './utils/seedDatabase';
import { seedProductionDatabase } from './utils/seedProduction';

const PORT = env.PORT;

const startServer = async () => {
  try {
    // Initialize analytics table
    await initAnalyticsTable();

    // Check if database has users, if not, seed it
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      if (env.NODE_ENV === 'production') {
        console.log('Database is empty in production. Seeding initial production data...');
        await seedProductionDatabase(prisma);
        console.log('Production database seeded successfully');
      } else {
        console.log('Database is empty, seeding with demo data...');
        await seedDemoDatabase(prisma);
        console.log('Database seeded successfully');
      }
    }

    // DO NOT disconnect Prisma here - it needs to stay active for the entire server lifetime
    // await prisma.$disconnect();

    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
