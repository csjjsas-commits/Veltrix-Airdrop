import { TaskVerificationType, TaskVerificationTypes, VerificationProvider, VerificationConfig } from './types';
import { TwitterService } from './twitter.service';
import { DiscordService } from './discord.service';
import { TelegramService } from './telegram.service';
import { YouTubeService } from './youtube.service';
import { WalletService } from './wallet.service';
import { ReferralService } from './referral.service';

export class VerificationProviderRegistry {
  private static providers: Map<TaskVerificationType, VerificationConfig> = new Map([
    // Twitter verifications
    [TaskVerificationTypes.TWITTER_FOLLOW, { type: TaskVerificationTypes.TWITTER_FOLLOW, provider: TwitterService }],
    [TaskVerificationTypes.TWITTER_LIKE, { type: TaskVerificationTypes.TWITTER_LIKE, provider: TwitterService }],
    [TaskVerificationTypes.TWITTER_RETWEET, { type: TaskVerificationTypes.TWITTER_RETWEET, provider: TwitterService }],
    [TaskVerificationTypes.TWITTER_CONNECT, { type: TaskVerificationTypes.TWITTER_CONNECT, provider: TwitterService }],

    // Discord verifications
    [TaskVerificationTypes.DISCORD_JOIN, { type: TaskVerificationTypes.DISCORD_JOIN, provider: DiscordService }],
    [TaskVerificationTypes.DISCORD_ROLE, { type: TaskVerificationTypes.DISCORD_ROLE, provider: DiscordService }],

    // Telegram verifications
    [TaskVerificationTypes.TELEGRAM_JOIN_CHANNEL, { type: TaskVerificationTypes.TELEGRAM_JOIN_CHANNEL, provider: TelegramService }],
    [TaskVerificationTypes.TELEGRAM_JOIN_GROUP, { type: TaskVerificationTypes.TELEGRAM_JOIN_GROUP, provider: TelegramService }],
    [TaskVerificationTypes.TELEGRAM_BOT_VERIFY, { type: TaskVerificationTypes.TELEGRAM_BOT_VERIFY, provider: TelegramService }],

    // YouTube verifications
    [TaskVerificationTypes.YOUTUBE_SUBSCRIBE, { type: TaskVerificationTypes.YOUTUBE_SUBSCRIBE, provider: YouTubeService }],
    [TaskVerificationTypes.YOUTUBE_LIKE, { type: TaskVerificationTypes.YOUTUBE_LIKE, provider: YouTubeService }],
    [TaskVerificationTypes.YOUTUBE_CONNECT, { type: TaskVerificationTypes.YOUTUBE_CONNECT, provider: YouTubeService }],

    // Wallet verifications
    [TaskVerificationTypes.WALLET_CONNECT, { type: TaskVerificationTypes.WALLET_CONNECT, provider: WalletService }],
    [TaskVerificationTypes.WALLET_HOLD_TOKEN, { type: TaskVerificationTypes.WALLET_HOLD_TOKEN, provider: WalletService }],
    [TaskVerificationTypes.WALLET_NFT_OWNERSHIP, { type: TaskVerificationTypes.WALLET_NFT_OWNERSHIP, provider: WalletService }],
    [TaskVerificationTypes.WALLET_TRANSACTION, { type: TaskVerificationTypes.WALLET_TRANSACTION, provider: WalletService }],

    // Referral verifications
    [TaskVerificationTypes.REFERRAL_INVITE, { type: TaskVerificationTypes.REFERRAL_INVITE, provider: ReferralService }],
  ]);

  static getProvider(verificationType: TaskVerificationType): VerificationProvider | null {
    const config = this.providers.get(verificationType);
    if (!config) return null;

    return new config.provider();
  }

  static getSupportedTypes(): TaskVerificationType[] {
    return Array.from(this.providers.keys());
  }

  static isVerificationType(type: TaskVerificationType): boolean {
    return this.providers.has(type);
  }
}