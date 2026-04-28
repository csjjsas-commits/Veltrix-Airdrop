import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { sanitizeLog } from '../utils/sanitize';

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    devLog(...args);
  }
};
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getPendingSubmissions,
  reviewSubmission,
  getAirdropConfig,
  updateAirdropConfig,
  getAdminStats,
  getTopUsersByPoints,
  AdminTask,
  SubmissionWithDetails,
  AdminStats,
  AirdropConfig
} from '../services/adminService';
import {
  createTaskSchema,
  updateTaskSchema,
  taskStatusSchema,
  reviewSubmissionSchema,
  updateConfigSchema
} from '../schemas/adminSchema';
import { ValidationError } from '../utils/errors';

// Task Management Controllers
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks: AdminTask[] = await getAllTasks();

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

export const createTaskHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    devLog('📥 [POST /admin/tasks] Received body:', JSON.stringify(sanitizeLog(req.body), null, 2));
    const taskData = createTaskSchema.parse(req.body);
    devLog('✅ [Validation passed] Parsed data:', JSON.stringify(taskData, null, 2));
    const task = await createTask(taskData);
    devLog('✅ [Task created]', task.id);

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: task
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('❌ [Validation error]', error.errors);
      res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors
      });
      return;
    }

    console.error('[CREATE TASK] Server error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
};

export const updateTaskHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    devLog(`📥 [PUT /admin/tasks/${id}] Body:`, JSON.stringify(sanitizeLog(req.body), null, 2));
    const taskData = updateTaskSchema.parse(req.body);
    devLog('✅ [Validation passed]');

    const task = await updateTask(id, taskData);
    devLog(`✅ [Task ${id} updated]`);

    res.json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      data: task
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('❌ [Validation error]', error.errors);
      res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors
      });
      return;
    }

    if (error instanceof ValidationError) {
      console.error('❌ [Validation error]', error.message);
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error('❌ [Update task error]', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
};

export const updateTaskStatusHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const statusData = taskStatusSchema.parse(req.body);

    const task = await updateTaskStatus(id, statusData);

    res.json({
      success: true,
      message: `Tarea ${statusData.active ? 'activada' : 'desactivada'} exitosamente`,
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
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const deleteTaskHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await deleteTask(id);

    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error('❌ [Delete task error]', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
};

// Submission Management Controllers
export const getSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const submissions: SubmissionWithDetails[] = await getPendingSubmissions();

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const reviewSubmissionHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reviewData = reviewSubmissionSchema.parse(req.body);

    const submission = await reviewSubmission(id, reviewData);

    res.json({
      success: true,
      message: `Submission ${reviewData.action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`,
      data: submission
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

    console.error('Error reviewing submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Configuration Controllers
export const getConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const config: AirdropConfig = await getAirdropConfig();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error('Error getting config:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const updateConfigHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const configData = updateConfigSchema.parse(req.body);
    const config = await updateAirdropConfig(configData);

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: config
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
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error('Error updating config:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getLeaderboardHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const leaderboard = await getTopUsersByPoints();

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Admin Stats Controller
export const getAdminStatsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats: AdminStats = await getAdminStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
