import prisma from '../utils/prismaClient';
import { TaskIdInput, SubmitTaskInput } from '../schemas/taskSchema';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

export interface TaskWithStatus {
  id: string;
  title: string;
  description: string | null;
  points: number;
  deadline: Date | null;
  taskType: string;
  actionUrl: string | null;
  verificationType: string | null;
  verificationMethod: string;
  platform: string | null;
  requiredTarget: string | null;
  requiredValue: string | null;
  requiresProof: boolean;
  weekNumber: number | null;
  startDate: Date | null;
  endDate: Date | null;
  timeLimit: number | null;
  referralTarget: string | null;
  requiredReferralActions: number | null;
  referralRequiredTaskId: string | null;
  active: boolean;
  verificationData: any;
  createdAt: Date;
  updatedAt: Date;
  status: string | null;
  completedAt: Date | null;
  linkOpenedAt: Date | null;
  pointsAwarded: number | null;
  referralCount?: number;
}

export interface UserRank {
  rankPosition: number;
  totalUsers: number;
  percentile: number;
}

export interface UserStats {
  userId: string;
  totalPoints: number;
  completedTasks: number;
  pendingTasks: number;
  estimatedTokens: string;
  level: number;
  progressToNextLevel: number;
  pointsToNextLevel: number;
  rank: number;
  totalUsers: number;
  percentile: number;
}

const LEVEL_XP = 500;

export const countValidReferrals = async (userId: string): Promise<number> => {
  return prisma.user.count({
    where: {
      referredById: userId,
      userTasks: {
        some: {
          status: 'COMPLETED'
        }
      }
    }
  });
};

const isTaskVisibleToUser = (task: any, currentWeek: number, now: Date): { visible: boolean; reason: string | null } => {
  if (!task.active) {
    return { visible: false, reason: 'inactive' };
  }

  if (task.weekNumber !== null && task.weekNumber > currentWeek) {
    return { visible: false, reason: 'weekNumber in future' };
  }

  if (task.startDate && task.startDate > now) {
    return { visible: false, reason: 'startDate in future' };
  }

  if (task.endDate && task.endDate < now) {
    return { visible: false, reason: 'endDate expired' };
  }

  if (task.deadline && task.deadline < now) {
    return { visible: false, reason: 'deadline expired' };
  }

  return { visible: true, reason: null };
};

const parseVerificationData = (value: any): any => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
};

const completeReferralTaskIfEligible = async (task: any, userId: string, validReferralCount: number) => {
  if (task.taskType !== 'REFERRAL' || task.requiredReferralActions == null) {
    return null;
  }

  if (validReferralCount < task.requiredReferralActions) {
    return null;
  }

  const existingUserTask = task.userTasks[0];

  if (existingUserTask && existingUserTask.status === 'COMPLETED') {
    return {
      status: existingUserTask.status,
      completedAt: existingUserTask.completedAt,
      pointsAwarded: existingUserTask.pointsAwarded
    };
  }

  const userTask = await prisma.userTask.upsert({
    where: {
      userId_taskId: {
        userId,
        taskId: task.id
      }
    },
    update: {
      status: 'COMPLETED',
      completedAt: new Date(),
      pointsAwarded: task.points
    },
    create: {
      userId,
      taskId: task.id,
      status: 'COMPLETED',
      completedAt: new Date(),
      pointsAwarded: task.points
    }
  });

  if (!existingUserTask || existingUserTask.status !== 'COMPLETED') {
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
  }

  return {
    status: userTask.status,
    completedAt: userTask.completedAt,
    pointsAwarded: userTask.pointsAwarded
  };
};

export interface DashboardData {
  user: {
    id: string;
    email: string;
    name: string;
    points: number;
    role: string;
  };
  stats: UserStats;
  recentTasks: TaskWithStatus[];
  availableTasks: TaskWithStatus[];
}

export const getTasksForUser = async (userId: string): Promise<TaskWithStatus[]> => {
  const validReferralCount = await countValidReferrals(userId);
  const currentAirdropConfig = await prisma.airdropConfig.findFirst();
  const currentWeek = currentAirdropConfig?.currentWeek ?? 1;
  const now = new Date();

  console.debug(`[TASK VISIBILITY] currentWeek=${currentWeek} now=${now.toISOString()}`);

  const tasks = await prisma.task.findMany({
    include: {
      userTasks: {
        where: { userId },
        select: {
          status: true,
          completedAt: true,
          pointsAwarded: true,
          linkOpenedAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const visibleTasks = tasks.filter((task) => {
    const { visible, reason } = isTaskVisibleToUser(task, currentWeek, now);
    if (!visible) {
      console.debug(
        `[TASK FILTERED] taskId=${task.id} title="${task.title}" active=${task.active} weekNumber=${task.weekNumber} startDate=${task.startDate?.toISOString() ?? 'null'} endDate=${task.endDate?.toISOString() ?? 'null'} deadline=${task.deadline?.toISOString() ?? 'null'} currentWeek=${currentWeek} reason=${reason}`
      );
    }
    return visible;
  });

  return await Promise.all(visibleTasks.map(async (task) => {
    let status = task.userTasks[0]?.status || 'NOT_STARTED';
    let completedAt = task.userTasks[0]?.completedAt || null;
    let pointsAwarded = task.userTasks[0]?.pointsAwarded || null;

    if (task.taskType === 'REFERRAL') {
      const referralResult = await completeReferralTaskIfEligible(task, userId, validReferralCount);
      if (referralResult) {
        status = referralResult.status;
        completedAt = referralResult.completedAt;
        pointsAwarded = referralResult.pointsAwarded;
      }
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      points: task.points,
      deadline: task.deadline,
      taskType: task.taskType,
      actionUrl: task.actionUrl,
      verificationType: task.verificationType,
      verificationMethod: task.verificationMethod,
      platform: task.platform,
      requiredTarget: task.requiredTarget,
      requiredValue: task.requiredValue,
      requiresProof: task.requiresProof,
      weekNumber: task.weekNumber,
      startDate: task.startDate,
      endDate: task.endDate,
      timeLimit: task.timeLimit,
      referralTarget: task.referralTarget,
      requiredReferralActions: task.requiredReferralActions,
      referralRequiredTaskId: task.referralRequiredTaskId,
      active: task.active,
      verificationData: parseVerificationData(task.verificationData),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      status,
      completedAt,
      pointsAwarded,
      referralCount: validReferralCount,
      linkOpenedAt: task.userTasks[0]?.linkOpenedAt || null
    };
  }));
};

export const getTaskById = async (taskId: string, userId: string): Promise<TaskWithStatus> => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      userTasks: {
        where: { userId },
        select: {
          status: true,
          completedAt: true,
          pointsAwarded: true,
          linkOpenedAt: true
        }
      }
    }
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  const validReferralCount = await countValidReferrals(userId);
  let status = task.userTasks[0]?.status || 'NOT_STARTED';
  let completedAt = task.userTasks[0]?.completedAt || null;
  let pointsAwarded = task.userTasks[0]?.pointsAwarded || null;
  let linkOpenedAt = task.userTasks[0]?.linkOpenedAt || null;

  if (task.taskType === 'REFERRAL') {
    const referralResult = await completeReferralTaskIfEligible(task, userId, validReferralCount);
    if (referralResult) {
      status = referralResult.status;
      completedAt = referralResult.completedAt;
      pointsAwarded = referralResult.pointsAwarded;
    }
  }

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    points: task.points,
    deadline: task.deadline,
    taskType: task.taskType,
    actionUrl: task.actionUrl,
    verificationType: task.verificationType,
    verificationMethod: task.verificationMethod,
    platform: task.platform,
    requiredTarget: task.requiredTarget,
    requiredValue: task.requiredValue,
    requiresProof: task.requiresProof,
    weekNumber: task.weekNumber,
    startDate: task.startDate,
    endDate: task.endDate,
    timeLimit: task.timeLimit,
    referralTarget: task.referralTarget,
    requiredReferralActions: task.requiredReferralActions,
    active: task.active,
    verificationData: parseVerificationData(task.verificationData),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    status,
    completedAt,
    pointsAwarded,
    referralCount: validReferralCount,
    linkOpenedAt
  };
};

export const completeTask = async (taskId: string, userId: string): Promise<TaskWithStatus> => {
  // Verificar que la tarea existe y está activa
  const task = await prisma.task.findUnique({
    where: { id: taskId }
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  if (!task.active) {
    throw new ForbiddenError('Esta tarea no está disponible');
  }

  // Verificar que el usuario no haya completado ya la tarea
  const existingUserTask = await prisma.userTask.findUnique({
    where: {
      userId_taskId: {
        userId,
        taskId
      }
    }
  });

  if (existingUserTask && existingUserTask.status === 'COMPLETED') {
    throw new ValidationError('Ya has completado esta tarea');
  }

  // Check if link needs to be opened for EXTERNAL_LINK and AUTO_COMPLETE tasks
  if (task.actionUrl && (task.taskType === 'EXTERNAL_LINK' || task.taskType === 'AUTO_COMPLETE')) {
    if (!existingUserTask || !existingUserTask.linkOpenedAt) {
      throw new ValidationError('Debes abrir el enlace antes de completar esta tarea');
    }
  }

  // Crear o actualizar la relación user-task
  const userTask = await prisma.userTask.upsert({
    where: {
      userId_taskId: {
        userId,
        taskId
      }
    },
    update: {
      status: 'COMPLETED',
      completedAt: new Date(),
      pointsAwarded: task.points
    },
    create: {
      userId,
      taskId,
      status: 'COMPLETED',
      completedAt: new Date(),
      pointsAwarded: task.points
    }
  });

  // Actualizar puntos del usuario
  await prisma.user.update({
    where: { id: userId },
    data: {
      points: {
        increment: task.points
      }
    }
  });

  // Handle referral actions if user was referred
  await handleReferralCompletion(userId, taskId);

  // Activate pending referrals if this task was required for any referral tasks
  await activatePendingReferrals(userId, taskId);

  // Actualizar puntos totales de la comunidad
  await prisma.airdropConfig.updateMany({
    data: {
      totalCommunityPoints: {
        increment: task.points
      }
    }
  });

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    points: task.points,
    deadline: task.deadline,
    taskType: task.taskType,
    actionUrl: task.actionUrl,
    verificationType: task.verificationType,
    verificationMethod: task.verificationMethod,
    platform: task.platform,
    requiredTarget: task.requiredTarget,
    requiredValue: task.requiredValue,
    requiresProof: task.requiresProof,
    weekNumber: task.weekNumber,
    startDate: task.startDate,
    endDate: task.endDate,
    timeLimit: task.timeLimit,
    referralTarget: task.referralTarget,
    requiredReferralActions: task.requiredReferralActions,
    referralRequiredTaskId: task.referralRequiredTaskId,
    active: task.active,
    verificationData: parseVerificationData(task.verificationData),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    status: userTask.status,
    completedAt: userTask.completedAt,
    pointsAwarded: userTask.pointsAwarded,
    linkOpenedAt: userTask.linkOpenedAt
  };
};

export const openLink = async (taskId: string, userId: string): Promise<TaskWithStatus> => {
  const task = await prisma.task.findUnique({
    where: { id: taskId }
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  if (!task.active) {
    throw new ValidationError('Esta tarea no está disponible');
  }

  // Check if user has started this task
  const userTask = await prisma.userTask.findUnique({
    where: {
      userId_taskId: {
        userId,
        taskId
      }
    }
  });

  if (!userTask || userTask.status !== 'IN_PROGRESS') {
    throw new ValidationError('Debes iniciar la tarea primero');
  }

  // Only allow for tasks that require link opening
  if (!task.actionUrl || (task.taskType !== 'EXTERNAL_LINK' && task.taskType !== 'AUTO_COMPLETE')) {
    throw new ValidationError('Esta tarea no requiere abrir enlaces');
  }

  // Update the linkOpenedAt timestamp
  const updatedUserTask = await prisma.userTask.update({
    where: {
      userId_taskId: {
        userId,
        taskId
      }
    },
    data: {
      linkOpenedAt: new Date()
    }
  });

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    points: task.points,
    deadline: task.deadline,
    taskType: task.taskType,
    actionUrl: task.actionUrl,
    verificationType: task.verificationType,
    verificationMethod: task.verificationMethod,
    platform: task.platform,
    requiredTarget: task.requiredTarget,
    requiredValue: task.requiredValue,
    requiresProof: task.requiresProof,
    weekNumber: task.weekNumber,
    startDate: task.startDate,
    endDate: task.endDate,
    timeLimit: task.timeLimit,
    referralTarget: task.referralTarget,
    requiredReferralActions: task.requiredReferralActions,
    active: task.active,
    verificationData: parseVerificationData(task.verificationData),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    status: updatedUserTask.status,
    completedAt: updatedUserTask.completedAt,
    pointsAwarded: updatedUserTask.pointsAwarded,
    linkOpenedAt: updatedUserTask.linkOpenedAt
  };
};

export const startTask = async (taskId: string, userId: string): Promise<TaskWithStatus> => {
  const task = await prisma.task.findUnique({
    where: { id: taskId }
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  if (!task.active) {
    throw new ValidationError('Esta tarea no está disponible');
  }

  const existingUserTask = await prisma.userTask.findUnique({
    where: {
      userId_taskId: {
        userId,
        taskId
      }
    }
  });

  if (existingUserTask && existingUserTask.status === 'COMPLETED') {
    throw new ValidationError('Ya has completado esta tarea');
  }

  const userTask = await prisma.userTask.upsert({
    where: {
      userId_taskId: {
        userId,
        taskId
      }
    },
    update: {
      status: 'IN_PROGRESS',
      completedAt: null,
      pointsAwarded: 0
    },
    create: {
      userId,
      taskId,
      status: 'IN_PROGRESS',
      pointsAwarded: 0
    }
  });

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    points: task.points,
    deadline: task.deadline,
    taskType: task.taskType,
    actionUrl: task.actionUrl,
    verificationType: task.verificationType,
    verificationMethod: task.verificationMethod,
    platform: task.platform,
    requiredTarget: task.requiredTarget,
    requiredValue: task.requiredValue,
    requiresProof: task.requiresProof,
    weekNumber: task.weekNumber,
    startDate: task.startDate,
    endDate: task.endDate,
    timeLimit: task.timeLimit,
    referralTarget: task.referralTarget,
    requiredReferralActions: task.requiredReferralActions,
    active: task.active,
    verificationData: parseVerificationData(task.verificationData),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    status: userTask.status,
    completedAt: userTask.completedAt,
    pointsAwarded: userTask.pointsAwarded,
    linkOpenedAt: userTask.linkOpenedAt
  };
};

export const submitTaskForReview = async (
  taskId: string,
  userId: string,
  data: SubmitTaskInput
): Promise<TaskWithStatus> => {
  // Verificar que la tarea existe y está activa
  const task = await prisma.task.findUnique({
    where: { id: taskId }
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  if (!task.active) {
    throw new ForbiddenError('Esta tarea no está disponible');
  }

  // Verificar que el usuario no haya completado ya la tarea
  const existingUserTask = await prisma.userTask.findUnique({
    where: {
      userId_taskId: {
        userId,
        taskId
      }
    }
  });

  if (existingUserTask && existingUserTask.status === 'COMPLETED') {
    throw new ValidationError('Ya has completado esta tarea');
  }

  if (existingUserTask && existingUserTask.status === 'PENDING') {
    throw new ValidationError('Ya hay un envío pendiente para esta tarea');
  }

  if (existingUserTask && existingUserTask.updatedAt) {
    const ageMs = new Date().getTime() - existingUserTask.updatedAt.getTime();
    if (ageMs < 5 * 60 * 1000) {
      throw new ValidationError('Espera unos minutos antes de reenviar la tarea');
    }
  }

  const proofMetadata = JSON.stringify({
    proof: data.proof,
    description: data.description || null,
    submittedAt: new Date().toISOString()
  });

  const userTask = await prisma.userTask.upsert({
    where: {
      userId_taskId: {
        userId,
        taskId
      }
    },
    update: {
      status: 'COMPLETED',
      completedAt: new Date(),
      pointsAwarded: task.points,
      verificationMetadata: proofMetadata
    },
    create: {
      userId,
      taskId,
      status: 'COMPLETED',
      completedAt: new Date(),
      pointsAwarded: task.points,
      verificationMetadata: proofMetadata
    }
  });

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

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    points: task.points,
    deadline: task.deadline,
    taskType: task.taskType,
    actionUrl: task.actionUrl,
    verificationType: task.verificationType,
    verificationMethod: task.verificationMethod,
    platform: task.platform,
    requiredTarget: task.requiredTarget,
    requiredValue: task.requiredValue,
    requiresProof: task.requiresProof,
    weekNumber: task.weekNumber,
    startDate: task.startDate,
    endDate: task.endDate,
    timeLimit: task.timeLimit,
    referralTarget: task.referralTarget,
    requiredReferralActions: task.requiredReferralActions,
    active: task.active,
    verificationData: parseVerificationData(task.verificationData),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    status: userTask.status,
    completedAt: userTask.completedAt,
    pointsAwarded: userTask.pointsAwarded,
    linkOpenedAt: userTask.linkOpenedAt
  };
};

export const getUserStats = async (userId: string): Promise<UserStats> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userTasks: {
        where: { status: 'COMPLETED' }
      }
    }
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const completedTasks = user.userTasks.length;
  const totalPoints = user.points;

  // Calcular tareas pendientes (tareas activas que no ha completado)
  const totalActiveTasks = await prisma.task.count({
    where: { active: true }
  });

  const pendingTasks = totalActiveTasks - completedTasks;

  // Calcular tokens estimados
  const airdropConfig = await prisma.airdropConfig.findFirst();

  let estimatedTokens = '0';
  if (airdropConfig && airdropConfig.totalCommunityPoints > 0) {
    const ratio = totalPoints / airdropConfig.totalCommunityPoints;
    const tokens = ratio * Number(airdropConfig.totalAirdropPool);
    estimatedTokens = tokens.toFixed(2);
  }

  const rankData = await getUserRank(userId);
  const level = Math.max(1, Math.floor(totalPoints / LEVEL_XP) + 1);
  const pointsToNextLevel = level * LEVEL_XP - totalPoints;
  const progressToNextLevel = Math.min(
    100,
    Math.max(0, Math.round(((totalPoints - (level - 1) * LEVEL_XP) / LEVEL_XP) * 100))
  );

  return {
    userId,
    totalPoints,
    completedTasks,
    pendingTasks: Math.max(0, pendingTasks),
    estimatedTokens,
    level,
    progressToNextLevel,
    pointsToNextLevel,
    rank: rankData.rankPosition,
    totalUsers: rankData.totalUsers,
    percentile: rankData.percentile
  };
};

export const getUserRank = async (userId: string): Promise<UserRank> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true }
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const [higherRankCount, totalUsers] = await Promise.all([
    prisma.user.count({
      where: {
        points: {
          gt: user.points
        }
      }
    }),
    prisma.user.count()
  ]);

  const rankPosition = higherRankCount + 1;
  const percentile = totalUsers > 0
    ? Math.max(0, Math.min(100, Math.round((1 - (rankPosition - 1) / totalUsers) * 100)))
    : 100;

  return {
    rankPosition,
    totalUsers,
    percentile
  };
};

export const getUserDashboard = async (userId: string): Promise<DashboardData> => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const [stats, tasks] = await Promise.all([
    getUserStats(userId),
    getTasksForUser(userId)
  ]);

  // Separar tareas recientes (últimas 5 completadas) y disponibles
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED')
    .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
    .slice(0, 5);

  const availableTasks = tasks.filter(t => t.status !== 'COMPLETED');

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      points: user.points,
      role: user.role
    },
    stats,
    recentTasks: completedTasks,
    availableTasks
  };
};

export const completeWalletTasks = async (userId: string): Promise<void> => {
  // Find all active wallet tasks
  const walletTasks = await prisma.task.findMany({
    where: {
      taskType: 'WALLET_ACTION',
      active: true
    }
  });

  for (const task of walletTasks) {
    // Check if user has already completed this task
    const existingUserTask = await prisma.userTask.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId: task.id
        }
      }
    });

    if (existingUserTask && existingUserTask.status === 'COMPLETED') {
      continue; // Already completed
    }

    // Complete the wallet task
    await prisma.userTask.upsert({
      where: {
        userId_taskId: {
          userId,
          taskId: task.id
        }
      },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
        pointsAwarded: task.points
      },
      create: {
        userId,
        taskId: task.id,
        status: 'COMPLETED',
        completedAt: new Date(),
        pointsAwarded: task.points
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

    // Update community points
    await prisma.airdropConfig.updateMany({
      data: {
        totalCommunityPoints: {
          increment: task.points
        }
      }
    });
  }
};

export const handleReferralCompletion = async (userId: string, taskId: string): Promise<void> => {
  // Find referral actions where this user is the referred user and the task matches
  const referralActions = await prisma.referralAction.findMany({
    where: {
      referredUserId: userId,
      taskId: taskId,
      taskCompleted: false
    },
    include: {
      referrer: true
    }
  });

  for (const action of referralActions) {
    // Mark the referral action as completed
    await prisma.referralAction.update({
      where: { id: action.id },
      data: {
        taskCompleted: true,
        completedAt: new Date()
      }
    });

    // Check if the referrer has completed all required referral actions for REFERRAL tasks
    const referralTasks = await prisma.task.findMany({
      where: { taskType: 'REFERRAL' }
    });

    for (const referralTask of referralTasks) {
      // Count completed referral actions for this referrer and task
      const completedActions = await prisma.referralAction.count({
        where: {
          referrerId: action.referrerId,
          taskId: referralTask.id,
          taskCompleted: true
        }
      });

      // Check if referrer meets the required number of referrals
      const requiredActions = referralTask.requiredReferralActions || 1;
      if (completedActions >= requiredActions) {
        // Check if referrer has already completed this referral task
        const existingUserTask = await prisma.userTask.findUnique({
          where: {
            userId_taskId: {
              userId: action.referrerId,
              taskId: referralTask.id
            }
          }
        });

        if (!existingUserTask || existingUserTask.status !== 'COMPLETED') {
          // Complete the referral task for the referrer
          await prisma.userTask.upsert({
            where: {
              userId_taskId: {
                userId: action.referrerId,
                taskId: referralTask.id
              }
            },
            update: {
              status: 'COMPLETED',
              completedAt: new Date(),
              pointsAwarded: referralTask.points
            },
            create: {
              userId: action.referrerId,
              taskId: referralTask.id,
              status: 'COMPLETED',
              completedAt: new Date(),
              pointsAwarded: referralTask.points
            }
          });

          // Update referrer's points
          await prisma.user.update({
            where: { id: action.referrerId },
            data: {
              points: {
                increment: referralTask.points
              }
            }
          });

          // Update community points
          await prisma.airdropConfig.updateMany({
            data: {
              totalCommunityPoints: {
                increment: referralTask.points
              }
            }
          });
        }
      }
    }
  }
};

export const activatePendingReferrals = async (userId: string, completedTaskId: string): Promise<void> => {
  // Find referral tasks that require this task as a prerequisite
  const referralTasks = await prisma.task.findMany({
    where: {
      taskType: 'REFERRAL',
      referralRequiredTaskId: completedTaskId
    }
  });

  for (const referralTask of referralTasks) {
    // Find pending referral actions for this user and referral task
    const pendingActions = await prisma.referralAction.findMany({
      where: {
        referredUserId: userId,
        taskId: referralTask.id,
        taskCompleted: false
      },
      include: {
        referrer: true
      }
    });

    for (const action of pendingActions) {
      // Mark the referral action as completed
      await prisma.referralAction.update({
        where: { id: action.id },
        data: {
          taskCompleted: true,
          completedAt: new Date()
        }
      });

      // Increment referral count for the referrer
      await prisma.userTask.upsert({
        where: {
          userId_taskId: {
            userId: action.referrerId,
            taskId: referralTask.id
          }
        },
        update: {
          referralCount: {
            increment: 1
          }
        },
        create: {
          userId: action.referrerId,
          taskId: referralTask.id,
          status: 'PENDING',
          referralCount: 1,
          pointsAwarded: 0
        }
      });

      // Check if referrer has completed all required referral actions
      const completedActions = await prisma.referralAction.count({
        where: {
          referrerId: action.referrerId,
          taskId: referralTask.id,
          taskCompleted: true
        }
      });

      const requiredActions = referralTask.requiredReferralActions || 1;
      if (completedActions >= requiredActions) {
        // Complete the referral task for the referrer
        await prisma.userTask.upsert({
          where: {
            userId_taskId: {
              userId: action.referrerId,
              taskId: referralTask.id
            }
          },
          update: {
            status: 'COMPLETED',
            completedAt: new Date(),
            pointsAwarded: referralTask.points
          },
          create: {
            userId: action.referrerId,
            taskId: referralTask.id,
            status: 'COMPLETED',
            completedAt: new Date(),
            pointsAwarded: referralTask.points
          }
        });

        // Update referrer's points
        await prisma.user.update({
          where: { id: action.referrerId },
          data: {
            points: {
              increment: referralTask.points
            }
          }
        });

        // Update community points
        await prisma.airdropConfig.updateMany({
          data: {
            totalCommunityPoints: {
              increment: referralTask.points
            }
          }
        });
      }
    }
  }
};
