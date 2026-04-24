import prisma from '../utils/prismaClient.js';

export interface AnalyticsMetrics {
  totalUsers: number;
  totalTasksCompleted: number;
  conversionRate: number;
  topTasks: Array<{
    id: string;
    title: string;
    completions: number;
  }>;
}

// Initialize analytics table if it doesn't exist
export const initAnalyticsTable = async () => {
  try {
    // Check if the table exists by trying to count records
    await prisma.analyticsEvent.count();
  } catch (error) {
    // Table doesn't exist, create it manually
    console.log('Creating analytics events table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
        "id" TEXT NOT NULL,
        "eventType" TEXT NOT NULL,
        "userId" TEXT,
        "properties" TEXT,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");
    `;

    console.log('Analytics events table created successfully');
  }
};

export class AnalyticsService {
  static async getBasicMetrics(): Promise<AnalyticsMetrics> {
    try {
      // Total users
      const totalUsers = await prisma.user.count();

      // Total tasks completed
      const totalTasksCompleted = await prisma.userTask.count({
        where: { status: 'COMPLETED' }
      });

      // Conversion rate (users who completed at least one task / total users)
      const usersWithCompletedTasks = await prisma.userTask.findMany({
        where: { status: 'COMPLETED' },
        select: { userId: true },
        distinct: ['userId']
      });

      const conversionRate = totalUsers > 0 ? usersWithCompletedTasks.length / totalUsers : 0;

      // Top tasks by completion count
      const topTasks = await prisma.userTask.groupBy({
        by: ['taskId'],
        where: { status: 'COMPLETED' },
        _count: { taskId: true },
        orderBy: { _count: { taskId: 'desc' } },
        take: 5
      });

      // Get task details for top tasks
      const taskDetails = await prisma.task.findMany({
        where: {
          id: { in: topTasks.map(t => t.taskId) }
        },
        select: { id: true, title: true }
      });

      const topTasksWithDetails = topTasks.map(taskGroup => {
        const taskDetail = taskDetails.find(t => t.id === taskGroup.taskId);
        return {
          id: taskGroup.taskId,
          title: taskDetail?.title || 'Unknown Task',
          completions: taskGroup._count.taskId
        };
      });

      return {
        totalUsers,
        totalTasksCompleted,
        conversionRate,
        topTasks: topTasksWithDetails
      };
    } catch (error) {
      console.error('Error fetching analytics metrics:', error);
      throw new Error('Failed to fetch analytics metrics');
    }
  }

  // Log custom events (for future use)
  static async logEvent(
    eventType: string,
    userId: string | null,
    properties: Record<string, any> = {}
  ): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType,
          userId,
          properties: JSON.stringify(properties),
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error logging analytics event:', error);
      // Don't throw - analytics logging shouldn't break the app
    }
  }
}