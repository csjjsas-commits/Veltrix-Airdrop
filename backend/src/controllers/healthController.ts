import { Request, Response, NextFunction } from 'express';
import { getHealthStatus } from '../services/healthService';

export const healthCheck = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await getHealthStatus();
    res.json(health);
  } catch (error) {
    next(error);
  }
};
