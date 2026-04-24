import { Router } from 'express';
import {
  getTasks,
  createTaskHandler,
  updateTaskHandler,
  updateTaskStatusHandler,
  getSubmissions,
  reviewSubmissionHandler,
  getConfig,
  updateConfigHandler,
  getLeaderboardHandler,
  getAdminStatsHandler
} from '../controllers/adminController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación de admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Task Management Routes
router.get('/tasks', getTasks);
router.post('/tasks', createTaskHandler);
router.put('/tasks/:id', updateTaskHandler);
router.patch('/tasks/:id/status', updateTaskStatusHandler);

// Submission Management Routes
router.get('/submissions', getSubmissions);
router.patch('/submissions/:id/review', reviewSubmissionHandler);

// Configuration Routes
router.get('/config', getConfig);
router.put('/config', updateConfigHandler);

// Admin Leaderboard Route
router.get('/leaderboard', getLeaderboardHandler);

// Admin Stats Route
router.get('/stats', getAdminStatsHandler);

export default router;
