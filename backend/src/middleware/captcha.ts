import { Request, Response, NextFunction } from 'express';
import { env } from '../utils/env.js';
import { ValidationError } from '../utils/errors.js';

type TurnstileResponse = {
  success: boolean;
  'error-codes'?: string[];
  hostname?: string;
  challenge_ts?: string;
};

export const verifyCaptcha = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.body.captchaToken || req.body.turnstileToken;

    // En desarrollo, permite cualquier token (incluyendo vacío)
    if (env.NODE_ENV !== 'production') {
      console.warn('Captcha verification bypassed in development mode');
      next();
      return;
    }

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new ValidationError('Captcha requerido');
    }

    if (!env.TURNSTILE_SECRET_KEY) {
      throw new ValidationError('Captcha no configurado correctamente');
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token
      })
    });

    const payload = (await response.json()) as TurnstileResponse;

    if (!payload.success) {
      throw new ValidationError('Captcha inválido');
    }

    next();
  } catch (error) {
    next(error);
  }
};
