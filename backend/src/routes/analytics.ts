import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { getAnalyticsMetrics, logAnalyticsEvent } from '../controllers/analyticsController.js';

const router = Router();

// Admin only routes
router.get('/metrics', authMiddleware, adminMiddleware, getAnalyticsMetrics);

// User routes (for logging events)
router.post('/events', authMiddleware, logAnalyticsEvent);

export default router;