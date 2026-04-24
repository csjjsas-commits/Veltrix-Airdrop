import { Router } from 'express';
import {
  getTasks,
  getTask,
  completeTaskHandler,
  submitTaskHandler,
  verifyTaskHandler,
  getUserStatsHandler,
  getUserDashboardHandler,
  getUserRankHandler,
  startTaskHandler
} from '../controllers/taskController';
import { authMiddleware } from '../middleware/auth';
import { submitLimiter, taskCompleteLimiter } from '../middleware/rateLimiter';
import { verifyCaptcha } from '../middleware/captcha';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/tasks - Listar tareas disponibles para el usuario
router.get('/', getTasks);

// GET /api/tasks/stats - Obtener estadísticas del usuario
router.get('/stats', getUserStatsHandler);

// GET /api/tasks/dashboard - Obtener dashboard completo del usuario
router.get('/dashboard', getUserDashboardHandler);

// GET /api/tasks/rank - Obtener el rank actual del usuario
router.get('/rank', getUserRankHandler);

// GET /api/tasks/:id - Obtener detalles de una tarea específica
router.get('/:id', getTask);

// POST /api/tasks/:id/complete - Completar una tarea automática
router.post(
  '/:id/complete',
  taskCompleteLimiter,
  completeTaskHandler
);

// POST /api/tasks/:id/start - Iniciar una tarea basada en acción externa o interna
router.post(
  '/:id/start',
  taskCompleteLimiter,
  startTaskHandler
);

// POST /api/tasks/:id/submit - Enviar tarea manual para revisión
router.post(
  '/:id/submit',
  submitLimiter,
  verifyCaptcha,
  submitTaskHandler
);

// POST /api/tasks/:id/verify - Verificar tarea automáticamente
router.post(
  '/:id/verify',
  taskCompleteLimiter,
  verifyTaskHandler
);

export default router;
