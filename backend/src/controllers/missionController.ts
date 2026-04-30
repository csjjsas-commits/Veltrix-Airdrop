import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import { verifyWithInvokeLLM } from '../services/invokeLLMService';
import { ValidationError } from '../utils/errors';

const ACTION_MAP: Record<string, string> = {
  TWITTER_FOLLOW: 'seguir la cuenta',
  TWITTER_LIKE: 'dar like al tweet',
  TWITTER_RETWEET: 'retuitear el tweet',
  TELEGRAM_JOIN_CHANNEL: 'unirse al canal',
  TELEGRAM_JOIN_GROUP: 'unirse al grupo',
  TELEGRAM_BOT_VERIFY: 'verificar con el bot',
  DISCORD_JOIN: 'unirse al servidor',
  DISCORD_MESSAGE: 'enviar un mensaje al servidor'
};

export const verifyMissionHandler = async (req: Request, res: Response) => {
  try {
    const { userId, taskId, handle } = req.body as {
      userId?: string;
      taskId?: string;
      handle?: string;
    };

    if (!userId || !taskId || !handle) {
      return res.status(400).json({
        success: false,
        message: 'Faltan parámetros requeridos: userId, taskId y handle son obligatorios.'
      });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Misión no encontrada.'
      });
    }

    const existingUserTask = await prisma.userTask.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId
        }
      }
    });

    if (existingUserTask && ['COMPLETED', 'IN_REVIEW'].includes(existingUserTask.status)) {
      return res.status(400).json({
        success: false,
        message: 'Esta misión ya ha sido completada o está en revisión.'
      });
    }

    const platform = task.platform ?? 'desconocida';
    const action = ACTION_MAP[task.verificationType ?? ''] || task.requiredValue || 'completar la acción requerida';
    const target = task.requiredTarget || task.requiredValue || task.title || 'el objetivo especificado';

    const verificationResult = await verifyWithInvokeLLM(platform, action, target, handle);

    if (verificationResult === 'APPROVED') {
      await prisma.userTask.upsert({
        where: {
          userId_taskId: {
            userId,
            taskId
          }
        },
        create: {
          userId,
          taskId,
          status: 'COMPLETED',
          completedAt: new Date(),
          pointsAwarded: task.points,
          lastCheckedAt: new Date(),
          externalId: 'invoke-llm',
          verificationMetadata: JSON.stringify({ handle, platform, action, target })
        },
        update: {
          status: 'COMPLETED',
          completedAt: new Date(),
          pointsAwarded: task.points,
          lastCheckedAt: new Date(),
          externalId: 'invoke-llm',
          verificationMetadata: JSON.stringify({ handle, platform, action, target })
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

      return res.status(200).json({
        success: true,
        message: 'Misión verificada con éxito.',
        xpAdded: task.points
      });
    }

    return res.status(400).json({
      success: false,
      message: 'No pudimos verificar la acción. Asegúrate de que el usuario haya completado la misión y prueba de nuevo.'
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Error verificando misión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al verificar la misión.'
    });
  }
};