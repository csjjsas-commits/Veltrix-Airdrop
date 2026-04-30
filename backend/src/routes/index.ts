import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import taskRouter from './tasks';
import missionRouter from './missions';
import adminRouter from './admin';
import analyticsRouter from './analytics';
import telegramRouter from './telegram';
import twitterRouter from './twitter';
import walletRouter from './wallet';
import referralRouter from './referral';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'AirDrop API is running', version: '1.0.0' });
});

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/tasks', taskRouter);
router.use('/missions', missionRouter);
router.use('/admin', adminRouter);
router.use('/analytics', analyticsRouter);
router.use('/telegram', telegramRouter);
router.use('/twitter', twitterRouter);
router.use('/wallet', walletRouter);
router.use('/referral', referralRouter);

export default router;
