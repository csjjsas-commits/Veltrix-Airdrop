import { VerificationProvider, VerificationResult } from './types';
import prisma from '../../utils/prismaClient';

export class YouTubeService implements VerificationProvider {
  private clientId: string;
  private clientSecret: string;
  private apiKey: string;

  constructor() {
    this.clientId = process.env.YOUTUBE_CLIENT_ID || '';
    this.clientSecret = process.env.YOUTUBE_CLIENT_SECRET || '';
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
  }

  async verify(
    userId: string,
    taskId: string,
    verificationData: any,
    userMetadata?: any
  ): Promise<VerificationResult> {
    const { action, targetId, accessToken, refreshToken, tokenExpiresAt } = verificationData;

    // Check if YouTube API is configured
    if (!this.clientId || !this.clientSecret || !this.apiKey) {
      return {
        success: false,
        message: 'YouTube provider is not configured. Verification is unsupported.',
        unsupported: true
      };
    }

    // Check if user has authorized YouTube access
    if (!accessToken) {
      return {
        success: false,
        message: 'YouTube access not authorized. Please connect your YouTube account first.',
        unsupported: true
      };
    }

    // Check if token is expired and refresh if needed
    let validAccessToken = accessToken;
    if (tokenExpiresAt && new Date(tokenExpiresAt) <= new Date()) {
      if (!refreshToken) {
        return {
          success: false,
          message: 'YouTube token expired and no refresh token available. Please reconnect your account.',
          unsupported: true
        };
      }

      const refreshResult = await this.refreshAccessToken(refreshToken);
      if (!refreshResult.success) {
        return refreshResult;
      }

      validAccessToken = refreshResult.accessToken!;

      // Update user's tokens in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          youtubeAccessToken: refreshResult.accessToken,
          youtubeRefreshToken: refreshResult.refreshToken || refreshToken,
          youtubeTokenExpiresAt: refreshResult.expiresAt
        }
      });
    }

    try {
      switch (action) {
        case 'subscribe':
          return await this.verifySubscription(userId, targetId, validAccessToken);
        case 'like':
          return await this.verifyLike(userId, targetId, validAccessToken);
        default:
          return {
            success: false,
            message: 'AcciÃ³n de YouTube no soportada'
          };
      }
    } catch (error) {
      console.error('YouTube verification error:', error);
      return {
        success: false,
        message: 'Error verificando YouTube. Intenta de nuevo.'
      };
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<VerificationResult & { accessToken?: string; refreshToken?: string; expiresAt?: Date }> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Failed to refresh YouTube access token. Please reconnect your account.',
          unsupported: true
        };
      }

      const data = await response.json();
      const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

      return {
        success: true,
        message: 'Token refreshed successfully',
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Google may not return new refresh token
        expiresAt
      };
    } catch (error) {
      console.error('Error refreshing YouTube token:', error);
      return {
        success: false,
        message: 'Error refreshing YouTube access token',
        unsupported: true
      };
    }
  }

  private async verifySubscription(
    userId: string,
    channelId: string,
    accessToken: string
  ): Promise<VerificationResult> {
    try {
      // Check if user is subscribed to the channel
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&forChannelId=${channelId}&key=${this.apiKey}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            message: 'Token de YouTube expirado. Reconecta tu cuenta.',
            unsupported: true
          };
        }
        return {
          success: false,
          message: 'Error verificando suscripciÃ³n al canal'
        };
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        return {
          success: true,
          message: 'Â¡SuscripciÃ³n al canal verificada exitosamente!',
          externalId: data.items[0].id,
          metadata: {
            subscribedAt: new Date().toISOString(),
            channelId,
            subscriptionId: data.items[0].id
          }
        };
      } else {
        return {
          success: false,
          message: 'No se detecta suscripciÃ³n a este canal. SuscrÃ­bete al canal y vuelve a verificar.'
        };
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      return {
        success: false,
        message: 'Error verificando suscripciÃ³n al canal'
      };
    }
  }

  private async verifyLike(
    userId: string,
    videoId: string,
    accessToken: string
  ): Promise<VerificationResult> {
    // YouTube API doesn't provide a reliable way to check if a user has liked a video
    // The rate endpoint only allows setting/getting the user's rating for their own videos
    return {
      success: false,
      message: 'La verificaciÃ³n de likes de YouTube no estÃ¡ soportada por la API de YouTube.',
      unsupported: true
    };
  }
  // OAuth helper methods for YouTube connection
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  async getUserChannelInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get user channel info');
      }

      const data = await response.json();
      return data.items?.[0] || null;
    } catch (error) {
      console.error('Error getting user channel info:', error);
      throw error;
    }
  }}
