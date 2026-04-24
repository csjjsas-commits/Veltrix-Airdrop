import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import taskRouter from './tasks.js';
import adminRouter from './admin.js';
import analyticsRouter from './analytics.js';
import telegramRouter from './telegram.js';
import youtubeRouter from './youtube.js';
import twitterRouter from './twitter.js';
import walletRouter from './wallet.js';
import referralRouter from './referral.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'AirDrop API is running', version: '1.0.0' });
});

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/tasks', taskRouter);
router.use('/admin', adminRouter);
router.use('/analytics', analyticsRouter);
router.use('/telegram', telegramRouter);
router.use('/youtube', youtubeRouter);
router.use('/twitter', twitterRouter);
router.use('/wallet', walletRouter);
router.use('/referral', referralRouter);

export default router;
