import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Warn if FRONTEND_URL is not set (defaults to localhost)
if (!process.env.FRONTEND_URL) {
  console.warn('Warning: FRONTEND_URL not set, defaulting to http://localhost:5173');
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  DATABASE_DIRECT_URL: process.env.DATABASE_DIRECT_URL || '',
  DATABASE_SHADOW_URL: process.env.DATABASE_SHADOW_URL || '',
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY || '',
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',
  DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || '',
  DISCORD_CALLBACK_REDIRECT: process.env.DISCORD_CALLBACK_REDIRECT || '',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  ADMIN_NAME: process.env.ADMIN_NAME || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL || '',
  YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID || '',
  YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET || '',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
  YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI || '',
  TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID || '',
  TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET || '',
  TWITTER_REDIRECT_URI: process.env.TWITTER_REDIRECT_URI || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
};
