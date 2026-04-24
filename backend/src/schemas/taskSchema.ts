import { z } from 'zod';
import { sanitizeString } from '../utils/sanitize.js';

export const taskIdSchema = z.object({
  id: z.string().uuid('ID de tarea inválido')
});

export const submitTaskSchema = z.object({
  proof: z.string().trim().min(20, 'La prueba debe tener al menos 20 caracteres').max(1000, 'La prueba es demasiado larga').transform(sanitizeString),
  description: z.string().trim().max(500, 'La descripción es demasiado larga').transform(sanitizeString).optional()
});

export type TaskIdInput = z.infer<typeof taskIdSchema>;
export type SubmitTaskInput = z.infer<typeof submitTaskSchema>;
