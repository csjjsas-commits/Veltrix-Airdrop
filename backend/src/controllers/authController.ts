import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../schemas/authSchema.js';
import { register, login, getUserById } from '../services/authService.js';
import { ZodError } from 'zod';
import { UnauthorizedError } from '../utils/errors.js';

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { captchaToken, ...validatedData } = registerSchema.parse(req.body);
    const result = await register(validatedData);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.errors });
    }
    next(error);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { captchaToken, ...validatedData } = loginSchema.parse(req.body);
    const result = await login(validatedData);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.errors });
    }
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const meController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('No autenticado');
    }

    const user = await getUserById(req.user.userId);
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};
