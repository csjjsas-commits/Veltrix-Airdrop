import xss from 'xss';

export const sanitizeString = (value: string): string => {
  return xss(value).trim();
};

export const sanitizeLog = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;

  const sanitized = { ...obj };
  const sensitiveFields = ['password', 'captchaToken', 'token', 'authorization'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};
