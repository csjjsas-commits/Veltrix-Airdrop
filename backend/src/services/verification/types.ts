export const TaskVerificationTypes = {
  TWITTER_FOLLOW: 'TWITTER_FOLLOW',
  TWITTER_LIKE: 'TWITTER_LIKE',
  TWITTER_RETWEET: 'TWITTER_RETWEET',
  DISCORD_JOIN: 'DISCORD_JOIN',
  DISCORD_ROLE: 'DISCORD_ROLE',
  TELEGRAM_JOIN_CHANNEL: 'TELEGRAM_JOIN_CHANNEL',
  TELEGRAM_JOIN_GROUP: 'TELEGRAM_JOIN_GROUP',
  TELEGRAM_BOT_VERIFY: 'TELEGRAM_BOT_VERIFY',
  YOUTUBE_SUBSCRIBE: 'YOUTUBE_SUBSCRIBE',
  YOUTUBE_LIKE: 'YOUTUBE_LIKE',
  WALLET_CONNECT: 'WALLET_CONNECT',
  WALLET_HOLD_TOKEN: 'WALLET_HOLD_TOKEN',
  WALLET_NFT_OWNERSHIP: 'WALLET_NFT_OWNERSHIP',
  WALLET_TRANSACTION: 'WALLET_TRANSACTION',
  REFERRAL_INVITE: 'REFERRAL_INVITE',
  MANUAL: 'MANUAL'
} as const;

export type TaskVerificationType = typeof TaskVerificationTypes[keyof typeof TaskVerificationTypes];

export interface VerificationResult {
  success: boolean;
  message: string;
  externalId?: string;
  metadata?: Record<string, any>;
  unsupported?: boolean;
}

export interface VerificationProvider {
  verify(
    userId: string,
    taskId: string,
    verificationData: any,
    userMetadata?: any
  ): Promise<VerificationResult>;
}

export interface VerificationConfig {
  type: TaskVerificationType;
  provider: new () => VerificationProvider;
}