import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getDiscordConnectUrlController, getDiscordStatusController, discordCallbackController } from '../controllers/discordController';

const router = Router();

router.get('/connect-url', authMiddleware, getDiscordConnectUrlController);
router.get('/status', authMiddleware, getDiscordStatusController);
router.get('/callback', discordCallbackController);

export default router;
