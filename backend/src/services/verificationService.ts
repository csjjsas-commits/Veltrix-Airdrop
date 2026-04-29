import prisma from '../utils/prismaClient';
import { VerificationProviderRegistry } from './verification/registry';
import { TaskVerificationTypes, TaskVerificationType, VerificationResult } from './verification/types';
import { NotFoundError, ValidationError } from '../utils/errors';
import { ReferralService } from './verification/referral.service';

export interface VerificationRequest {
  verificationType: TaskVerificationType;
  verificationData: any;
  userMetadata?: any;
}

export class VerificationService {
  static async verifyTask(
    userId: string,
    taskId: string,
    verificationRequest: VerificationRequest
  ): Promise<VerificationResult & { taskCompleted: boolean }> {
    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        userTasks: {
          where: { userId }
        }
      }
    });

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    if (!task.active) {
      throw new ValidationError('Esta tarea no está disponible');
    }

    // Check if task requires verification
    if (!task.verificationType || task.verificationType === TaskVerificationTypes.MANUAL) {
      throw new ValidationError('Esta tarea no requiere verificación automática');
    }

    const verificationType = task.verificationType as TaskVerificationType;

    // Check if user already completed this task
    const userTask = task.userTasks[0];
    if (userTask && userTask.status === 'COMPLETED') {
      throw new ValidationError('Ya has completado esta tarea');
    }

    // Get user data for verification (needed for YouTube and Twitter access tokens)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        youtubeAccessToken: true,
        youtubeRefreshToken: true,
        youtubeTokenExpiresAt: true,
        twitterAccessToken: true,
        twitterRefreshToken: true,
        twitterTokenExpiresAt: true
      }
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Get verification provider
    const provider = VerificationProviderRegistry.getProvider(verificationType);
    if (!provider) {
      throw new ValidationError('Tipo de verificación no soportado');
    }

    // Prepare verification data with task defaults and request overrides
    const verificationData = {
      ...(task.verificationData || {}),
      ...(verificationRequest.verificationData || {}),
      ...(verificationRequest.userHandle ? { userHandle: verificationRequest.userHandle } : {}),
      ...(verificationRequest.linkOpenedAt ? { linkOpenedAt: verificationRequest.linkOpenedAt } : {})
    };

    if (verificationType === TaskVerificationTypes.YOUTUBE_SUBSCRIBE || verificationType === TaskVerificationTypes.YOUTUBE_LIKE) {
      verificationData.accessToken = user.youtubeAccessToken;
      verificationData.refreshToken = user.youtubeRefreshToken;
      verificationData.tokenExpiresAt = user.youtubeTokenExpiresAt;
    } else if (verificationType === TaskVerificationTypes.TWITTER_FOLLOW || verificationType === TaskVerificationTypes.TWITTER_LIKE || verificationType === TaskVerificationTypes.TWITTER_RETWEET) {
      verificationData.accessToken = user.twitterAccessToken;
      verificationData.refreshToken = user.twitterRefreshToken;
      verificationData.tokenExpiresAt = user.twitterTokenExpiresAt;
    }

    // Perform verification
    const result = await provider.verify(
      userId,
      taskId,
      verificationData,
      verificationRequest.userMetadata
    );

    if (result.unsupported) {
      return {
        ...result,
        taskCompleted: false
      };
    }

    // Update user task with verification result
    const updatedUserTask = await prisma.userTask.upsert({
      where: {
        userId_taskId: {
          userId,
          taskId
        }
      },
      update: {
        verificationMetadata: result.metadata ? JSON.stringify(result.metadata) : null,
        lastCheckedAt: new Date(),
        externalId: result.externalId,
        ...(result.success && {
          status: 'COMPLETED',
          completedAt: new Date(),
          pointsAwarded: task.points
        }),
        ...(!result.success && {
          status: 'REJECTED',
          pointsAwarded: 0
        })
      },
      create: {
        userId,
        taskId,
        verificationMetadata: result.metadata ? JSON.stringify(result.metadata) : null,
        lastCheckedAt: new Date(),
        externalId: result.externalId,
        ...(result.success ? {
          status: 'COMPLETED',
          completedAt: new Date(),
          pointsAwarded: task.points
        } : {
          status: 'REJECTED',
          pointsAwarded: 0
        })
      }
    });

    // If verification successful, update user points and community total
    if (result.success) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: task.points
          }
        }
      });

      await prisma.airdropConfig.updateMany({
        data: {
          totalCommunityPoints: {
            increment: task.points
          }
        }
      });

      // Track referral completion if user was referred
      const referralService = new ReferralService();
      await referralService.trackReferralCompletion(userId, taskId);

      // Check if referral task should be auto-completed
      const referrerUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { referredById: true }
      });

      if (referrerUser?.referredById) {
        await referralService.checkAndCompleteReferralTask(referrerUser.referredById);
      }
    }

    return {
      ...result,
      taskCompleted: result.success
    };
  }

  static async getVerificationStatus(userId: string, taskId: string) {
    const userTask = await prisma.userTask.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId
        }
      },
      select: {
        status: true,
        verificationMetadata: true,
        lastCheckedAt: true,
        externalId: true,
        completedAt: true
      }
    });

    return userTask;
  }

  static getSupportedVerificationTypes(): TaskVerificationType[] {
    return VerificationProviderRegistry.getSupportedTypes();
  }
}