import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../services/authService';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado');
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (!payload) {
      throw new UnauthorizedError('Token inválido');
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const adminMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('No autenticado');
    }

    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenError('Solo administradores pueden acceder');
    }

    next();
  } catch (error) {
    next(error);
  }
};
