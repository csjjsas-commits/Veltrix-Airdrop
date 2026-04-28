import { Router } from 'express';
import { verifyMissionHandler } from '../controllers/missionController';

const router = Router();
router.post('/verify', verifyMissionHandler);

export default router;
