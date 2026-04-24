import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { getAnalyticsMetrics, logAnalyticsEvent } from '../controllers/analyticsController';

const router = Router();

// Admin only routes
router.get('/metrics', authMiddleware, adminMiddleware, getAnalyticsMetrics);

// User routes (for logging events)
router.post('/events', authMiddleware, logAnalyticsEvent);

export default router;