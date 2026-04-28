import { z } from 'zod';
import { sanitizeString } from '../utils/sanitize';
import { TaskVerificationTypes } from '../services/verification/types';

const safeString = (max: number, message: string) =>
  z.string().trim().min(1, 'El campo no puede quedar vacío').max(max, message).transform(sanitizeString);

export const taskTypeEnum = z.enum([
  'INTERNAL_ACTION',
  'EXTERNAL_LINK',
  'MANUAL_SUBMIT',
  'REFERRAL',
  'AUTO_COMPLETE',
  'WALLET_ACTION'
]);

export const taskVerificationMethodEnum = z.enum([
  'SYSTEM_AUTOMATIC',
  'MANUAL_REVIEW',
  'USER_CONFIRMATION',
  'REFERRAL_VALIDATION'
]);

const taskVerificationTypeEnum = z.enum([
  TaskVerificationTypes.TWITTER_FOLLOW,
  TaskVerificationTypes.TWITTER_LIKE,
  TaskVerificationTypes.TWITTER_RETWEET,
  TaskVerificationTypes.DISCORD_JOIN,
  TaskVerificationTypes.DISCORD_ROLE,
  TaskVerificationTypes.TELEGRAM_JOIN_CHANNEL,
  TaskVerificationTypes.TELEGRAM_JOIN_GROUP,
  TaskVerificationTypes.TELEGRAM_BOT_VERIFY,
  TaskVerificationTypes.YOUTUBE_SUBSCRIBE,
  TaskVerificationTypes.YOUTUBE_LIKE,
  TaskVerificationTypes.WALLET_CONNECT,
  TaskVerificationTypes.WALLET_HOLD_TOKEN,
  TaskVerificationTypes.WALLET_NFT_OWNERSHIP,
  TaskVerificationTypes.WALLET_TRANSACTION,
  TaskVerificationTypes.MANUAL
]);

const dateString = z.preprocess((value) => {
  if (!value || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    // Handle date-only format (YYYY-MM-DD) and convert to ISO with Z
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed}T00:00:00Z`;
    }
    return trimmed;
  }
  return value;
}, z.union([z.string().datetime(), z.null()]).nullable().optional()).default(null);

export const createTaskSchema = z.object({
  title: safeString(255, 'El título es demasiado largo'),
  description: z.string().trim().max(1000, 'La descripción es demasiado larga').transform(sanitizeString).optional(),
  points: z.number().int().positive('Los puntos deben ser un número positivo').max(10000, 'Los puntos son demasiado altos'),
  deadline: dateString.optional().default(null),
  taskType: taskTypeEnum.default('AUTO_COMPLETE'),
  actionUrl: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '') ? null : value,
    z.string().trim().url('La URL de acción debe ser válida').optional().nullable()
  ),
  verificationType: taskVerificationTypeEnum.optional().nullable(),
  verificationData: z.record(z.any()).optional().nullable(),
  verificationMethod: taskVerificationMethodEnum.default('SYSTEM_AUTOMATIC'),
  platform: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '') ? null : value,
    z.string().trim().max(50, 'La plataforma es demasiado larga').optional().nullable()
  ),
  requiredTarget: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '') ? null : value,
    z.string().trim().max(1000, 'El objetivo requerido es demasiado largo').optional().nullable()
  ),
  requiredValue: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '') ? null : value,
    z.string().trim().max(1000, 'El valor requerido es demasiado largo').optional().nullable()
  ),
  requiresProof: z.boolean().default(false),
  weekNumber: z.number().int().min(1, 'La semana debe ser positiva').optional().nullable(),
  startDate: dateString.optional().default(null),
  endDate: dateString.optional().default(null),
  timeLimit: z.number().int().min(1, 'El límite de tiempo debe ser positivo').optional().nullable(),
  referralTarget: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '') ? null : value,
    z.string().trim().max(1000, 'El objetivo de referencia es demasiado largo').optional().nullable()
  ),
  requiredReferralActions: z.number().int().min(0, 'Las acciones de referencia deben ser un número positivo').optional().nullable(),
  active: z.boolean().default(true),
  isRequired: z.boolean().default(false)
});

export const updateTaskSchema = z.object({
  title: safeString(255, 'El título es demasiado largo').optional(),
  description: z.string().trim().max(1000, 'La descripción es demasiado larga').transform(sanitizeString).optional(),
  points: z.number().int().positive('Los puntos deben ser un número positivo').max(10000, 'Los puntos son demasiado altos').optional(),
  deadline: dateString.optional().default(null),
  taskType: taskTypeEnum.optional(),
  actionUrl: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '') ? null : value,
    z.string().trim().url('La URL de acción debe ser válida').optional().nullable()
  ),
  verificationType: taskVerificationTypeEnum.optional().nullable(),
  verificationData: z.record(z.any()).optional().nullable(),
  verificationMethod: taskVerificationMethodEnum.optional(),
  platform: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '') ? null : value,
    z.string().trim().max(50, 'La plataforma es demasiado larga').optional().nullable()
  ),
  requiredTarget: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '') ? null : value,
    z.string().trim().max(1000, 'El objetivo requerido es demasiado largo').optional().nullable()
  ),
  requiredValue: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '') ? null : value,
    z.string().trim().max(1000, 'El valor requerido es demasiado largo').optional().nullable()
  ),
  requiresProof: z.boolean().optional(),
  weekNumber: z.number().int().min(1, 'La semana debe ser positiva').optional().nullable(),
  startDate: dateString.optional().default(null),
  endDate: dateString.optional().default(null),
  timeLimit: z.number().int().min(1, 'El límite de tiempo debe ser positivo').optional().nullable(),
  referralTarget: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '') ? null : value,
    z.string().trim().max(1000, 'El objetivo de referencia es demasiado largo').optional().nullable()
  ),
  requiredReferralActions: z.number().int().min(0, 'Las acciones de referencia deben ser un número positivo').optional().nullable(),
  active: z.boolean().optional(),
  isRequired: z.boolean().optional()
});

export const taskStatusSchema = z.object({
  active: z.boolean()
});

export const reviewSubmissionSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'La acción debe ser "approve" o "reject"' })
  }),
  pointsAwarded: z.number().int().min(0, 'Los puntos no pueden ser negativos').max(10000, 'Los puntos son demasiado altos').optional(),
  adminNotes: z.string().trim().max(1000, 'Las notas son demasiado largas').transform(sanitizeString).optional()
});

export const updateConfigSchema = z.object({
  totalAirdropPool: z.string().regex(/^\d+(\.\d{1,2})?$/, 'El pool debe ser un número decimal válido').optional(),
  currentWeek: z.number().int().min(1, 'La semana debe ser un número positivo').optional()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;
export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;
export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;
