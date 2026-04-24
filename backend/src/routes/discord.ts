import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDiscordConnectUrlController, getDiscordStatusController, discordCallbackController } from '../controllers/discordController.js';

const router = Router();

router.get('/connect-url', authMiddleware, getDiscordConnectUrlController);
router.get('/status', authMiddleware, getDiscordStatusController);
router.get('/callback', discordCallbackController);

export default router;
