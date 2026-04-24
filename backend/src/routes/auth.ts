import { Router } from 'express';
import { registerController, loginController, meController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authLimiter, registerLimiter } from '../middleware/rateLimiter.js';
import { verifyCaptcha } from '../middleware/captcha.js';
import discordRouter from './discord.js';
import youtubeRouter from './youtube.js';

const router = Router();

router.post('/register', registerLimiter, verifyCaptcha, registerController);
router.post('/login', authLimiter, verifyCaptcha, loginController);
router.get('/me', authMiddleware, meController);
router.use('/discord', discordRouter);
router.use('/youtube', youtubeRouter);

export default router;
