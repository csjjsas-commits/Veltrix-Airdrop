import { env } from './utils/env.js';
import app from './app.js';
import { initAnalyticsTable } from './services/analyticsService.js';
import prisma from './utils/prismaClient.js';
import { seedDemoDatabase } from './utils/seedDatabase.js';

const PORT = env.PORT;

const startServer = async () => {
  try {
    // Initialize analytics table
    await initAnalyticsTable();

    // Check if database has users, if not, seed it
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      if (env.NODE_ENV === 'production') {
        console.warn(
          'Database is empty and demo seeding is disabled in production. Create the initial admin with `npm run seed:admin` or set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME.'
        );
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
