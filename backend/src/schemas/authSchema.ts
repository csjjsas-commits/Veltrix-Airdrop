import { z } from 'zod';
import { sanitizeString } from '../utils/sanitize';

const nonEmptyString = () => z.string().trim().min(1, 'El campo no puede quedar vacío').max(255, 'El valor es demasiado largo').transform(sanitizeString);

// CAPTCHA completamente opcional en desarrollo
const captchaSchema = process.env.NODE_ENV === 'production'
  ? nonEmptyString()
  : z.string().optional().default('dev-mode').or(z.string().min(0));

export const registerSchema = z.object({
  email: z.string().trim().email('Email inválido').max(254, 'Email demasiado largo').transform(sanitizeString),
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre es demasiado largo').transform(sanitizeString),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128, 'La contraseña es demasiado larga'),
  referralCode: z.string().trim().max(50, 'El código de referido es demasiado largo').optional(),
  captchaToken: captchaSchema
});

export const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').max(254, 'Email demasiado largo').transform(sanitizeString),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128, 'La contraseña es demasiado larga'),
  captchaToken: captchaSchema
});

export type RegisterInput = Omit<z.infer<typeof registerSchema>, 'captchaToken'>;
export type LoginInput = Omit<z.infer<typeof loginSchema>, 'captchaToken'>;
