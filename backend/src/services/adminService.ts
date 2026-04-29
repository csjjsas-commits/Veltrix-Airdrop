import prisma from '../utils/prismaClient';
import { Prisma, Task, UserTask } from '@prisma/client';
import { CreateTaskInput, UpdateTaskInput, TaskStatusInput, ReviewSubmissionInput, UpdateConfigInput } from '../schemas/adminSchema';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface AdminTask extends Task {
  _count: {
    userTasks: number;
  };
}

export interface SubmissionWithDetails {
  id: string;
  status: string;
  completedAt: Date | null;
  pointsAwarded: number | null;
  user: {
    id: string;
    email: string;
    name: string;
  };
  task: {
    id: string;
    title: string;
    points: number;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalCommunityPoints: number;
  totalTasks: number;
  pendingSubmissions: number;
  activeTasks: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  points: number;
}

export interface AirdropConfig {
  id: string;
  totalAirdropPool: Prisma.Decimal;
  currentWeek: number;
  totalCommunityPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

// Task Management
export const getAllTasks = async (): Promise<AdminTask[]> => {
  return await prisma.task.findMany({
    include: {
      _count: {
        select: {
          userTasks: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const createTask = async (data: CreateTaskInput): Promise<Task> => {
  try {
    console.log('📦 [createTask] Creating with data:', data);

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        points: data.points,
        deadline: data.deadline ? new Date(data.deadline) : null,
        taskType: data.taskType,
        actionUrl: data.actionUrl || null,
        verificationType: data.verificationType || null,
        verificationData: data.verificationData ? JSON.stringify(data.verificationData) : null,
        verificationMethod: data.verificationMethod,
        platform: data.platform || null,
        requiredTarget: data.requiredTarget || null,
        requiredValue: data.requiredValue || null,
        requiresProof: data.requiresProof,
        weekNumber: data.weekNumber ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        timeLimit: data.timeLimit ?? null,
        referralTarget: data.referralTarget || null,
        requiredReferralActions: data.requiredReferralActions ?? null,
        active: data.active,
        isRequired: data.isRequired ?? false
      }
    });

    console.log('✅ [createTask] Success:', task.id);
    return task;
  } catch (error) {
    console.error('❌ [createTask] Error:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, data: UpdateTaskInput): Promise<Task> => {
  try {
    console.log(`📦 [updateTask] Updating task ${taskId}`);
    
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.points !== undefined) updateData.points = data.points;
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.taskType !== undefined) updateData.taskType = data.taskType;
    if (data.actionUrl !== undefined) updateData.actionUrl = data.actionUrl || null;
    if (data.verificationType !== undefined) updateData.verificationType = data.verificationType || null;
    if (data.verificationData !== undefined) updateData.verificationData = data.verificationData ? JSON.stringify(data.verificationData) : null;
    if (data.verificationMethod !== undefined) updateData.verificationMethod = data.verificationMethod;
    if (data.platform !== undefined) updateData.platform = data.platform || null;
    if (data.requiredTarget !== undefined) updateData.requiredTarget = data.requiredTarget || null;
    if (data.requiredValue !== undefined) updateData.requiredValue = data.requiredValue || null;
    if (data.requiresProof !== undefined) updateData.requiresProof = data.requiresProof;
    if (data.weekNumber !== undefined) updateData.weekNumber = data.weekNumber ?? null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.timeLimit !== undefined) updateData.timeLimit = data.timeLimit ?? null;
    if (data.referralTarget !== undefined) updateData.referralTarget = data.referralTarget || null;
    if (data.requiredReferralActions !== undefined) updateData.requiredReferralActions = data.requiredReferralActions ?? null;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;

    console.log('✅ [updateTask] Applying changes to fields:', Object.keys(updateData));

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });

    console.log(`✅ [updateTask] Success`);
    return updated;
  } catch (error) {
    console.error(`❌ [updateTask] Error:`, error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, data: TaskStatusInput): Promise<Task> => {
  const task = await prisma.task.findUnique({
    where: { id: taskId }
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  return await prisma.task.update({
    where: { id: taskId },
    data: { active: data.active }
  });
};

// Task Deletion
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    console.log(`🗑️ [deleteTask] Deleting task ${taskId}`);
    
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    // Delete associated user tasks first
    await prisma.userTask.deleteMany({
      where: { taskId }
    });

    // Then delete the task
    await prisma.task.delete({
      where: { id: taskId }
    });

    console.log(`✅ [deleteTask] Task ${taskId} deleted successfully`);
  } catch (error) {
    console.error(`❌ [deleteTask] Error deleting task ${taskId}:`, error);
    throw error;
  }
};

// Submission Management
export const getPendingSubmissions = async (): Promise<SubmissionWithDetails[]> => {
  const submissions = await prisma.userTask.findMany({
    where: {
      status: 'PENDING'
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      },
      task: {
        select: {
          id: true,
          title: true,
          points: true
        }
      }
    },
    orderBy: { completedAt: 'desc' }
  });

  return submissions.map(submission => ({
    id: submission.id,
    status: submission.status,
    completedAt: submission.completedAt,
    pointsAwarded: submission.pointsAwarded,
    user: submission.user,
    task: submission.task
  }));
};

export const reviewSubmission = async (
  submissionId: string,
  data: ReviewSubmissionInput
): Promise<UserTask> => {
  const submission = await prisma.userTask.findUnique({
    where: { id: submissionId },
    include: { task: true, user: true }
  });

  if (!submission) {
    throw new NotFoundError('Submission no encontrada');
  }

  if (submission.status !== 'PENDING') {
    throw new ValidationError('Esta submission ya fue revisada');
  }

  const updateData: any = {
    status: data.action === 'approve' ? 'COMPLETED' : 'FAILED'
  };

  if (data.action === 'approve') {
    const pointsToAward = data.pointsAwarded ?? submission.task.points;
    updateData.pointsAwarded = pointsToAward;

    // Actualizar puntos del usuario
    await prisma.user.update({
      where: { id: submission.userId },
      data: {
        points: {
          increment: pointsToAward
        }
      }
    });

    // Actualizar puntos totales de la comunidad
    await prisma.airdropConfig.updateMany({
      data: {
        totalCommunityPoints: {
          increment: pointsToAward
        }
      }
    });
  } else {
    updateData.pointsAwarded = 0;
  }

  return await prisma.userTask.update({
    where: { id: submissionId },
    data: updateData
  });
};

// Configuration Management
export const getAirdropConfig = async (): Promise<AirdropConfig> => {
  let config = await prisma.airdropConfig.findFirst();

  if (!config) {
    config = await prisma.airdropConfig.create({
      data: {
        totalAirdropPool: new Prisma.Decimal('10000000'),
        currentWeek: 1,
        totalCommunityPoints: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    });
  }

  return config;
};

export const updateAirdropConfig = async (data: UpdateConfigInput): Promise<AirdropConfig> => {
  let config = await prisma.airdropConfig.findFirst();

  if (!config) {
    config = await prisma.airdropConfig.create({
      data: {
        totalAirdropPool: new Prisma.Decimal('10000000'),
        currentWeek: 1,
        totalCommunityPoints: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    });
  }

  const updateData: any = {};
  if (data.totalAirdropPool !== undefined) {
    updateData.totalAirdropPool = data.totalAirdropPool;
  }
  if (data.currentWeek !== undefined) {
    updateData.currentWeek = data.currentWeek;
  }

  return await prisma.airdropConfig.update({
    where: { id: config.id },
    data: updateData
  });
};

export const getTopUsersByPoints = async (limit = 10): Promise<LeaderboardEntry[]> => {
  return await prisma.user.findMany({
    where: { role: 'USER' },
    orderBy: [{ points: 'desc' }, { createdAt: 'asc' }],
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      points: true
    }
  });
};

// Admin Statistics
export const getAdminStats = async (): Promise<AdminStats> => {
  const [
    totalUsers,
    totalCommunityPointsResult,
    totalTasks,
    pendingSubmissions,
    activeTasks
  ] = await Promise.all([
    prisma.user.count(),
    prisma.airdropConfig.findFirst({
      select: { totalCommunityPoints: true }
    }),
    prisma.task.count(),
    prisma.userTask.count({
      where: { status: 'PENDING' }
    }),
    prisma.task.count({
      where: { active: true }
    })
  ]);

  return {
    totalUsers,
    totalCommunityPoints: totalCommunityPointsResult?.totalCommunityPoints ?? 0,
    totalTasks,
    pendingSubmissions,
    activeTasks
  };
};
