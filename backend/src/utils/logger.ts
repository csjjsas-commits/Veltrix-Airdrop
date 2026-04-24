export const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Airdrop]', ...args);
    }
  },
  warn: (...args: unknown[]) => console.warn('[Airdrop][WARN]', ...args),
  error: (...args: unknown[]) => console.error('[Airdrop][ERROR]', ...args)
};
