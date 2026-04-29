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

    // En producción, por ahora permitimos continuar si hay problemas con Cloudflare
    // TODO: Revertir esto cuando se resuelvan los problemas de Cloudflare
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.warn('Captcha token missing or empty - allowing request to continue due to Cloudflare issues');
      next();
      return;
    }

    if (!env.TURNSTILE_SECRET_KEY) {
      console.warn('TURNSTILE_SECRET_KEY not configured - allowing request to continue');
      next();
      return;
    }

    console.log('Verifying captcha token with Cloudflare...');

    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token
        })
      });

      if (!response.ok) {
        console.warn('Cloudflare API error - allowing request to continue:', response.status);
        next();
        return;
      }

      const payload = (await response.json()) as TurnstileResponse;

      if (!payload.success) {
        console.warn('Turnstile verification failed - allowing request to continue due to Cloudflare issues:', {
          'error-codes': payload['error-codes'],
          hostname: payload.hostname,
          challenge_ts: payload.challenge_ts
        });
        next();
        return;
      }

      console.log('Captcha verification successful');
    } catch (fetchError) {
      console.warn('Error contacting Cloudflare API - allowing request to continue:', fetchError);
      next();
      return;
    }

    next();
  } catch (error) {
    console.warn('Captcha middleware error - allowing request to continue:', error);
    next();
  }
};
