import { ValidationError } from '../utils/errors';

const INVOKE_LLM_API_URL = process.env.INVOKELLM_API_URL;
const INVOKE_LLM_API_KEY = process.env.INVOKELLM_API_KEY;
const INVOKE_LLM_MODEL = process.env.INVOKELLM_MODEL || 'gpt-4.1';

const buildPrompt = (platform: string, action: string, target: string, userHandle: string) => {
  return `Actúa como un auditor de redes sociales. Tu objetivo es verificar si el usuario '${userHandle}' ha completado la acción '${action}' en la cuenta objetivo '${target}' dentro de la plataforma '${platform}'. Responde ÚNICAMENTE con la palabra 'APPROVED' si existe evidencia de la acción, o 'REJECTED' si no se puede verificar.`;
};

const parseChatCompletion = (json: any): string | null => {
  if (!json || typeof json !== 'object') return null;

  if (Array.isArray(json.choices) && json.choices.length > 0) {
    const choice = json.choices[0];
    if (choice?.message && typeof choice.message.content === 'string') {
      return choice.message.content;
    }
    if (typeof choice.text === 'string') {
      return choice.text;
    }
  }

  if (typeof json.output === 'string') {
    return json.output;
  }
  if (typeof json.text === 'string') {
    return json.text;
  }

  return null;
};

const normalizeResponse = (raw: unknown): 'APPROVED' | 'REJECTED' => {
  if (!raw) {
    throw new ValidationError('Respuesta inválida de InvokeLLM');
  }

  const text = String(raw).trim().toUpperCase();
  const normalized = text.replace(/[^A-Z]/g, '');

  if (normalized.includes('APPROVED')) return 'APPROVED';
  if (normalized.includes('REJECTED')) return 'REJECTED';

  throw new ValidationError('Respuesta inválida de InvokeLLM');
};

export const verifyWithInvokeLLM = async (
  platform: string,
  action: string,
  target: string,
  userHandle: string
): Promise<'APPROVED' | 'REJECTED'> => {
  if (!INVOKE_LLM_API_URL || !INVOKE_LLM_API_KEY) {
    throw new ValidationError('InvokeLLM no está configurado');
  }

  const prompt = buildPrompt(platform, action, target, userHandle);

  const response = await fetch(INVOKE_LLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${INVOKE_LLM_API_KEY}`
    },
    body: JSON.stringify({
      model: INVOKE_LLM_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0,
      max_tokens: 32
    })
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`InvokeLLM request failed: ${response.status} ${payload}`);
  }

  const json = await response.json();
  const llmOutput = parseChatCompletion(json);

  if (!llmOutput) {
    throw new ValidationError('Respuesta inválida de InvokeLLM');
  }

  return normalizeResponse(llmOutput);
};