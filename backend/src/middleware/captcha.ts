import { Request, Response, NextFunction } from 'express';
import { env } from '../utils/env';
import { ValidationError } from '../utils/errors';

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
      console.error('Captcha token missing or empty');
      throw new ValidationError('Captcha token missing');
    }

    if (!env.TURNSTILE_SECRET_KEY) {
      console.error('TURNSTILE_SECRET_KEY not configured');
      throw new ValidationError('Captcha not configured correctly');
    }

    console.log('Verifying captcha token with Cloudflare...');

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
      console.error('Turnstile verification failed:', {
        'error-codes': payload['error-codes'],
        hostname: payload.hostname,
        challenge_ts: payload.challenge_ts
      });

      const details = process.env.NODE_ENV === 'development' ? { 'error-codes': payload['error-codes'] } : undefined;
      throw new ValidationError('Captcha inválido', details);
    }

    console.log('Captcha verification successful');
    next();
  } catch (error) {
    next(error);
  }
};
