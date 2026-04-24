export const logger = {
  info: (...args: unknown[]) => console.log('[Airdrop]', ...args),
  warn: (...args: unknown[]) => console.warn('[Airdrop][WARN]', ...args),
  error: (...args: unknown[]) => console.error('[Airdrop][ERROR]', ...args)
};
