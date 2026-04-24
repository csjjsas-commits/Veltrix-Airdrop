import { PrismaClient } from '@prisma/client';

export const cleanupDemoData = async (prisma: PrismaClient) => {
  console.log('Starting demo data cleanup...');

  // Find demo users to remove
  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: '@airdrop.local' } },
        { name: { startsWith: 'Demo' } }
      ]
    },
    select: { id: true, email: true, name: true }
  });

  if (demoUsers.length === 0) {
    console.log('No demo users found to clean up');
    return;
  }

  console.log(`Found ${demoUsers.length} demo users to remove:`);
  demoUsers.forEach(user => console.log(`  - ${user.email} (${user.name})`));

  // Get user IDs for cleanup
  const userIds = demoUsers.map(user => user.id);

  // Delete in correct order to respect foreign keys
  const deletedUserTasks = await prisma.userTask.deleteMany({
    where: { userId: { in: userIds } }
  });

  const deletedAnalytics = await prisma.analyticsEvent.deleteMany({
    where: { userId: { in: userIds } }
  });

  const deletedReferrals = await prisma.referralAction.deleteMany({
    where: {
      OR: [
        { referrerId: { in: userIds } },
        { referredUserId: { in: userIds } }
      ]
    }
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: userIds } }
  });

  console.log('Cleanup completed:');
  console.log(`  - Deleted ${deletedUserTasks.count} user tasks`);
  console.log(`  - Deleted ${deletedAnalytics.count} analytics events`);
  console.log(`  - Deleted ${deletedReferrals.count} referral actions`);
  console.log(`  - Deleted ${deletedUsers.count} demo users`);

  // Update community points in AirdropConfig
  const totalCommunityPoints = await prisma.user.aggregate({
    _sum: { points: true }
  });

  await prisma.airdropConfig.updateMany({
    data: {
      totalCommunityPoints: totalCommunityPoints._sum.points || 0
    }
  });

  console.log(`Updated total community points to: ${totalCommunityPoints._sum.points || 0}`);
};