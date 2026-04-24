import xss from 'xss';

export const sanitizeString = (value: string): string => {
  return xss(value).trim();
};
