import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

const cooldownMap = new Map<string, number>();

export const createCooldown = (windowMs: number, message: string, prefix = '') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = `${prefix}:${req.user?.userId ?? req.ip}`;
    const now = Date.now();
    const last = cooldownMap.get(key);

    if (last && now - last < windowMs) {
      return next(new ValidationError(message));
    }

    cooldownMap.set(key, now);
    next();
  };
};
