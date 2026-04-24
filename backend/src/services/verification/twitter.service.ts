import { VerificationProvider, VerificationResult } from './types';
import prisma from '../../utils/prismaClient';
import crypto from 'crypto';

export class TwitterService implements VerificationProvider {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.TWITTER_CLIENT_ID || '';
    this.clientSecret = process.env.TWITTER_CLIENT_SECRET || '';
    this.redirectUri = process.env.TWITTER_REDIRECT_URI || '';
  }

  async verify(
    userId: string,
    taskId: string,
    verificationData: any,
    userMetadata?: any
  ): Promise<VerificationResult> {
    const { action, targetId, accessToken, refreshToken, tokenExpiresAt } = verificationData;

    // Check if Twitter API is configured
    if (!this.clientId || !this.clientSecret) {
      return {
        success: false,
        message: 'Twitter provider is not configured. Verification is unsupported.',
        unsupported: true
      };
    }

    // Check if user has authorized Twitter access
    if (!accessToken) {
      return {
        success: false,
        message: 'Twitter access not authorized. Please connect your Twitter account first.',
        unsupported: true
      };
    }

    // Check if token is expired and refresh if needed
    let validAccessToken = accessToken;
    if (tokenExpiresAt && new Date(tokenExpiresAt) <= new Date()) {
      if (!refreshToken) {
        return {
          success: false,
          message: 'Twitter token expired and no refresh token available. Please reconnect your account.',
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
          twitterAccessToken: refreshResult.accessToken,
          twitterRefreshToken: refreshResult.refreshToken || refreshToken,
          twitterTokenExpiresAt: refreshResult.expiresAt
        }
      });
    }

    try {
      switch (action) {
        case 'follow':
          return await this.verifyFollow(userId, targetId, validAccessToken);
        case 'like':
          return await this.verifyLike(userId, targetId, validAccessToken);
        case 'retweet':
          return await this.verifyRetweet(userId, targetId, validAccessToken);
        default:
          return {
            success: false,
            message: 'Acción de Twitter no soportada'
          };
      }
    } catch (error) {
      console.error('Twitter verification error:', error);
      return {
        success: false,
        message: 'Error verificando Twitter. Intenta de nuevo.'
      };
    }
  }

  // Generate OAuth 2.0 PKCE authorization URL
  generateAuthUrl(state: string): { authUrl: string; codeVerifier: string } {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'tweet.read users.read follows.read like.read',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

    return { authUrl, codeVerifier };
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<VerificationResult & { accessToken?: string; refreshToken?: string; expiresAt?: Date; userId?: string; username?: string }> {
    try {
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          code: code,
          grant_type: 'authorization_code',
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Twitter token exchange error:', errorData);
        return {
          success: false,
          message: 'Failed to exchange authorization code for token',
          unsupported: true
        };
      }

      const data = await response.json();
      const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

      // Get user info
      const userResponse = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });

      if (!userResponse.ok) {
        return {
          success: false,
          message: 'Failed to get user information from Twitter',
          unsupported: true
        };
      }

      const userData = await userResponse.json();

      return {
        success: true,
        message: 'Token exchanged successfully',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        userId: userData.data.id,
        username: userData.data.username
      };
    } catch (error) {
      console.error('Error exchanging Twitter code for token:', error);
      return {
        success: false,
        message: 'Error exchanging authorization code',
        unsupported: true
      };
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<VerificationResult & { accessToken?: string; refreshToken?: string; expiresAt?: Date }> {
    try {
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          client_id: this.clientId
        })
      });

      if (!response.ok) {
        return {
          success: false,
          message: 'Failed to refresh Twitter access token. Please reconnect your account.',
          unsupported: true
        };
      }

      const data = await response.json();
      const expiresAt = new Date(Date.now() + (data.expires_in * 1000));

      return {
        success: true,
        message: 'Token refreshed successfully',
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt
      };
    } catch (error) {
      console.error('Error refreshing Twitter token:', error);
      return {
        success: false,
        message: 'Error refreshing Twitter access token',
        unsupported: true
      };
    }
  }

  private async verifyFollow(userId: string, targetUsername: string, accessToken: string): Promise<VerificationResult> {
    try {
      // Get target user ID first
      const targetUserResponse = await fetch(`https://api.twitter.com/2/users/by/username/${targetUsername}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!targetUserResponse.ok) {
        return {
          success: false,
          message: 'No se pudo encontrar la cuenta de Twitter especificada'
        };
      }

      const targetUserData = await targetUserResponse.json();
      const targetUserId = targetUserData.data.id;

      // Check if user follows the target
      const followResponse = await fetch(`https://api.twitter.com/2/users/${userId}/following`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!followResponse.ok) {
        if (followResponse.status === 403) {
          return {
            success: false,
            message: 'No tienes permisos para verificar follows. Esta función no está disponible.',
            unsupported: true
          };
        }
        return {
          success: false,
          message: 'Error verificando seguimiento'
        };
      }

      const followData = await followResponse.json();
      const isFollowing = followData.data?.some((user: any) => user.id === targetUserId);

      if (isFollowing) {
        return {
          success: true,
          message: '¡Seguimiento verificado exitosamente!',
          externalId: targetUserId,
          metadata: {
            followedAt: new Date().toISOString(),
            targetUsername,
            targetUserId
          }
        };
      } else {
        return {
          success: false,
          message: 'No se detecta que sigues a esta cuenta. Síguela y vuelve a verificar.'
        };
      }
    } catch (error) {
      console.error('Error verifying Twitter follow:', error);
      return {
        success: false,
        message: 'Error verificando seguimiento en Twitter'
      };
    }
  }

  private async verifyLike(userId: string, tweetId: string, accessToken: string): Promise<VerificationResult> {
    try {
      // Check if user has liked the tweet
      const likeResponse = await fetch(`https://api.twitter.com/2/users/${userId}/liked_tweets`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!likeResponse.ok) {
        if (likeResponse.status === 403) {
          return {
            success: false,
            message: 'No tienes permisos para verificar likes. Esta función no está disponible.',
            unsupported: true
          };
        }
        return {
          success: false,
          message: 'Error verificando like'
        };
      }

      const likeData = await likeResponse.json();
      const hasLiked = likeData.data?.some((tweet: any) => tweet.id === tweetId);

      if (hasLiked) {
        return {
          success: true,
          message: '¡Like verificado exitosamente!',
          externalId: tweetId,
          metadata: {
            likedAt: new Date().toISOString(),
            tweetId
          }
        };
      } else {
        return {
          success: false,
          message: 'No se detecta que has dado like a este tweet. Dale like y vuelve a verificar.'
        };
      }
    } catch (error) {
      console.error('Error verifying Twitter like:', error);
      return {
        success: false,
        message: 'Error verificando like en Twitter'
      };
    }
  }

  private async verifyRetweet(userId: string, tweetId: string, accessToken: string): Promise<VerificationResult> {
    // Twitter API v2 doesn't provide a direct way to check retweets
    // The retweets endpoint requires different scopes that may not be available
    return {
      success: false,
      message: 'La verificación de retweets no está soportada por la API de Twitter v2.',
      unsupported: true
    };
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private generateCodeChallenge(codeVerifier: string): string {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    return hash.toString('base64url');
  }
}