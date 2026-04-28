import { Router } from 'express';
import { registerController, loginController, meController, saveWalletController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { authLimiter, registerLimiter } from '../middleware/rateLimiter';
import { verifyCaptcha } from '../middleware/captcha';
import discordRouter from './discord';
import youtubeRouter from './youtube';
import googleRouter from './google';

const router = Router();

router.post('/register', registerLimiter, verifyCaptcha, registerController);
router.post('/login', authLimiter, verifyCaptcha, loginController);
router.get('/me', authMiddleware, meController);
router.post('/wallet', authMiddleware, saveWalletController);
router.use('/discord', discordRouter);
router.use('/youtube', youtubeRouter);
router.use('/google', googleRouter);

export default router;
