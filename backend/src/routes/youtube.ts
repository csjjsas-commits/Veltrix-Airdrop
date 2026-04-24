import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { YouTubeService } from '../services/verification/youtube.service.js';
import prisma from '../utils/prismaClient.js';

const router = Router();
const youtubeService = new YouTubeService();

// Get YouTube OAuth URL
router.get('/auth-url', authMiddleware, (req, res) => {
  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;

    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: 'YouTube OAuth not configured'
      });
    }

    const scope = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Error generating YouTube auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating auth URL'
    });
  }
});

import { env } from '../utils/env.js';

// OAuth callback
router.get('/callback', authMiddleware, async (req, res) => {
  try {
    const { code, error } = req.query;
    const userId = req.user!.userId;

    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/dashboard?youtube_error=${error}`);
    }

    if (!code) {
      return res.redirect(`${env.FRONTEND_URL}/dashboard?youtube_error=no_code`);
    }

    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;

    // Exchange code for tokens
    const tokenData = await youtubeService.exchangeCodeForToken(code as string, redirectUri);

    // Get user channel info
    const channelInfo = await youtubeService.getUserChannelInfo(tokenData.accessToken);

    // Store tokens in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        youtubeAccessToken: tokenData.accessToken,
        youtubeRefreshToken: tokenData.refreshToken,
        youtubeTokenExpiresAt: new Date(Date.now() + (tokenData.expiresIn * 1000)),
        youtubeChannelId: channelInfo?.id,
        youtubeChannelTitle: channelInfo?.snippet?.title,
        youtubeConnectedAt: new Date()
      }
    });

    res.redirect(`${env.FRONTEND_URL}/dashboard?youtube_success=true`);
  } catch (error) {
    console.error('YouTube OAuth callback error:', error);
    res.redirect(`${env.FRONTEND_URL}/dashboard?youtube_error=auth_failed`);
  }
});

// Get YouTube connection status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        youtubeChannelId: true,
        youtubeChannelTitle: true,
        youtubeConnectedAt: true,
        youtubeTokenExpiresAt: true
      }
    });

    if (!user?.youtubeChannelId) {
      return res.json({
        success: true,
        connected: false
      });
    }

    const isExpired = user.youtubeTokenExpiresAt && new Date() > user.youtubeTokenExpiresAt;

    res.json({
      success: true,
      connected: true,
      channel: {
        id: user.youtubeChannelId,
        title: user.youtubeChannelTitle,
        connectedAt: user.youtubeConnectedAt,
        tokenExpired: isExpired
      }
    });
  } catch (error) {
    console.error('Error getting YouTube status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving YouTube status'
    });
  }
});

// Disconnect YouTube
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;

    await prisma.user.update({
      where: { id: userId },
      data: {
        youtubeAccessToken: null,
        youtubeRefreshToken: null,
        youtubeTokenExpiresAt: null,
        youtubeChannelId: null,
        youtubeChannelTitle: null,
        youtubeConnectedAt: null
      }
    });

    res.json({
      success: true,
      message: 'YouTube disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting YouTube:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting YouTube'
    });
  }
});

export default router;