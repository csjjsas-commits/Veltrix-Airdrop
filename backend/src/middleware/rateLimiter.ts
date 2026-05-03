import rateLimit from 'express-rate-limit';

const createLimiter = (options: Parameters<typeof rateLimit>[0]) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Demasiadas solicitudes, intenta nuevamente más tarde.' },
    ...options
  });

export const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120
});

export const authLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 6,
  message: { success: false, message: 'Has alcanzado el límite de intentos de autenticación. Intenta en 10 minutos.' }
});

export const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 4,
  message: { success: false, message: 'Demasiados registros desde esta IP. Intenta en 1 hora.' }
});

export const submitLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Demasiados envíos de tareas. Intenta en unos minutos.' }
});

export const taskCompleteLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 8,
  message: { success: false, message: 'Demasiados intentos de completar tareas. Intenta nuevamente más tarde.' }
});
