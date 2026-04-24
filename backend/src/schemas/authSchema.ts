import { z } from 'zod';
import { sanitizeString } from '../utils/sanitize';

const nonEmptyString = () => z.string().trim().min(1, 'El campo no puede quedar vacío').max(255, 'El valor es demasiado largo').transform(sanitizeString);

// CAPTCHA opcional - validado por middleware
const captchaSchema = z.string().optional();

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

export const walletSchema = z.object({
  walletAddress: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, 'Dirección de wallet inválida (debe ser formato Ethereum 0x...)').transform(sanitizeString)
});

export type RegisterInput = Omit<z.infer<typeof registerSchema>, 'captchaToken'>;
export type LoginInput = Omit<z.infer<typeof loginSchema>, 'captchaToken'>;
export type WalletInput = z.infer<typeof walletSchema>;
