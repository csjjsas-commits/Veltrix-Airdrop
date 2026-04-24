import { VerificationProvider, VerificationResult } from './types';
import prisma from '../../utils/prismaClient';

export class ReferralService implements VerificationProvider {
  async verify(
    userId: string,
    taskId: string,
    verificationData: any,
    userMetadata?: any
  ): Promise<VerificationResult> {
    const { referralTarget } = verificationData;

    try {
      // Get the task to check referral target
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!task || !task.referralTarget) {
        return {
          success: false,
          message: 'Configuración de referral inválida'
        };
      }

      // Count how many valid referrals this user has
      // A valid referral is one where the referred user has completed at least 1 task
      const validReferrals = await prisma.referralAction.count({
        where: {
          referrerId: userId,
          taskCompleted: true
        }
      });

      // Parse the referral target (e.g., "5" means 5 successful referrals needed)
      const requiredReferrals = parseInt(referralTarget);

      if (isNaN(requiredReferrals)) {
        return {
          success: false,
          message: 'Configuración de referral inválida'
        };
      }

      if (validReferrals >= requiredReferrals) {
        return {
          success: true,
          message: `¡Felicidades! Has referido exitosamente ${validReferrals} usuarios.`,
          externalId: userId,
          metadata: {
            validReferrals,
            requiredReferrals,
            verifiedAt: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          message: `Necesitas ${requiredReferrals} referrals válidos. Actualmente tienes ${validReferrals}.`
        };
      }
    } catch (error) {
      console.error('Referral verification error:', error);
      return {
        success: false,
        message: 'Error verificando referrals. Intenta de nuevo.'
      };
    }
  }

  /**
   * Track when a referred user completes a task
   * This is called from the task completion logic
   */
  async trackReferralCompletion(userId: string, taskId: string): Promise<void> {
    try {
      // Find the referrer for this user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { referredById: true }
      });

      if (!user || !user.referredById) {
        return; // User wasn't referred
      }

      // Create or update referral action
      await prisma.referralAction.upsert({
        where: {
          referrerId_referredUserId_taskId: {
            referrerId: user.referredById,
            referredUserId: userId,
            taskId
          }
        },
        update: {
          taskCompleted: true,
          completedAt: new Date()
        },
        create: {
          referrerId: user.referredById,
          referredUserId: userId,
          taskId,
          taskCompleted: true,
          completedAt: new Date()
        }
      });

      console.log(`Tracked referral completion: ${user.referredById} referred ${userId}`);
    } catch (error) {
      console.error('Error tracking referral completion:', error);
      // Don't throw - this should not break the main task completion flow
    }
  }

  /**
   * Check if user has reached referral task threshold and auto-complete if needed
   */
  async checkAndCompleteReferralTask(userId: string): Promise<{ completed: boolean; taskId?: string }> {
    try {
      // Find referral tasks where this user is the referrer
      const referralTasks = await prisma.task.findMany({
        where: {
          verificationType: 'REFERRAL_INVITE',
          active: true
        }
      });

      for (const task of referralTasks) {
        if (!task.referralTarget) continue;

        const requiredReferrals = parseInt(task.referralTarget);
        if (isNaN(requiredReferrals)) continue;

        // Count valid referrals
        const validReferrals = await prisma.referralAction.count({
          where: {
            referrerId: userId,
            taskCompleted: true
          }
        });

        // If user has reached the threshold, complete the task
        if (validReferrals >= requiredReferrals) {
          // Check if user task already exists
          const userTask = await prisma.userTask.findUnique({
            where: {
              userId_taskId: {
                userId,
                taskId: task.id
              }
            }
          });

          if (userTask && userTask.status !== 'COMPLETED') {
            // Auto-complete the task
            await prisma.userTask.update({
              where: { id: userTask.id },
              data: {
                status: 'COMPLETED',
                pointsAwarded: task.points,
                completedAt: new Date()
              }
            });

            // Update user points
            await prisma.user.update({
              where: { id: userId },
              data: {
                points: {
                  increment: task.points
                }
              }
            });

            console.log(`Auto-completed referral task ${task.id} for user ${userId}`);
            return { completed: true, taskId: task.id };
          }
        }
      }

      return { completed: false };
    } catch (error) {
      console.error('Error checking referral task completion:', error);
      return { completed: false };
    }
  }
}
