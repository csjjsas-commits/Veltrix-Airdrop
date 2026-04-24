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
} from '../controllers/taskController.js';
import { authMiddleware } from '../middleware/auth.js';
import { submitLimiter, taskCompleteLimiter } from '../middleware/rateLimiter.js';
import { verifyCaptcha } from '../middleware/captcha.js';
import { createCooldown } from '../middleware/cooldown.js';

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
  createCooldown(30 * 1000, 'Espera 30 segundos antes de realizar otra acción.'),
  completeTaskHandler
);

// POST /api/tasks/:id/start - Iniciar una tarea basada en acción externa o interna
router.post(
  '/:id/start',
  taskCompleteLimiter,
  createCooldown(30 * 1000, 'Espera 30 segundos antes de realizar otra acción.'),
  startTaskHandler
);

// POST /api/tasks/:id/submit - Enviar tarea manual para revisión
router.post(
  '/:id/submit',
  submitLimiter,
  verifyCaptcha,
  createCooldown(30 * 1000, 'Espera 30 segundos antes de realizar otra acción.'),
  submitTaskHandler
);

// POST /api/tasks/:id/verify - Verificar tarea automáticamente
router.post(
  '/:id/verify',
  taskCompleteLimiter,
  createCooldown(30 * 1000, 'Espera 30 segundos antes de realizar otra acción.'),
  verifyTaskHandler
);

export default router;
