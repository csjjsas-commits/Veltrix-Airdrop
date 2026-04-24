import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  getTasksForUser,
  getTaskById,
  completeTask,
  submitTaskForReview,
  startTask,
  getUserStats,
  getUserDashboard,
  getUserRank,
  TaskWithStatus,
  UserStats,
  DashboardData
} from '../services/taskService.js';
import { VerificationService, VerificationRequest } from '../services/verificationService.js';
import { taskIdSchema, submitTaskSchema } from '../schemas/taskSchema.js';
import { ValidationError } from '../utils/errors.js';

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const tasks: TaskWithStatus[] = await getTasksForUser(userId);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Validar ID de tarea
    const { id: taskId } = taskIdSchema.parse({ id });

    const task: TaskWithStatus = await getTaskById(taskId, userId);

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'ID de tarea inválido',
        errors: error.errors
      });
      return;
    }

    console.error('Error getting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getUserRankHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const rankInfo = await getUserRank(userId);

    res.json({
      success: true,
      data: rankInfo
    });
  } catch (error) {
    console.error('Error getting user rank:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const completeTaskHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Validar ID de tarea
    const { id: taskId } = taskIdSchema.parse({ id });

    const task: TaskWithStatus = await completeTask(taskId, userId);

    res.json({
      success: true,
      message: 'Tarea completada exitosamente',
      data: task
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'ID de tarea inválido',
        errors: error.errors
      });
      return;
    }

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const startTaskHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const { id: taskId } = taskIdSchema.parse({ id });
    const task: TaskWithStatus = await startTask(taskId, userId);

    res.json({
      success: true,
      message: 'Tarea iniciada',
      data: task
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'ID de tarea inválido',
        errors: error.errors
      });
      return;
    }

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error('Error starting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const submitTaskHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Validar ID de tarea
    const { id: taskId } = taskIdSchema.parse({ id });

    // Validar datos de envío
    const submitData = submitTaskSchema.parse(req.body);

    const task: TaskWithStatus = await submitTaskForReview(taskId, userId, submitData);

    res.json({
      success: true,
      message: 'Tarea enviada para revisión exitosamente',
      data: task
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors
      });
      return;
    }

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error('Error submitting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const verifyTaskHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Validar ID de tarea
    const { id: taskId } = taskIdSchema.parse({ id });

    // Validar datos de verificación
    const verificationData = req.body;

    if (!verificationData || typeof verificationData !== 'object') {
      res.status(400).json({
        success: false,
        message: 'Datos de verificación requeridos'
      });
      return;
    }

    const result = await VerificationService.verifyTask(userId, taskId, verificationData);

    res.json({
      success: result.success,
      message: result.message,
      data: {
        verified: result.success,
        taskCompleted: result.taskCompleted,
        externalId: result.externalId,
        metadata: result.metadata,
        unsupported: result.unsupported ?? false
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors
      });
      return;
    }

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error('Error verifying task:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getUserStatsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const stats: UserStats = await getUserStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getUserDashboardHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const dashboard: DashboardData = await getUserDashboard(userId);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error getting user dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
