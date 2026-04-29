import { Router } from 'express';
import { TwitterService } from '../services/verification/twitter.service';
import { authMiddleware } from '../middleware/auth';
import prisma from '../utils/prismaClient';

const router = Router();
const twitterService = new TwitterService();

// Store code verifiers temporarily (in production, use Redis or similar)
const codeVerifiers = new Map<string, string>();

// Generate OAuth authorization URL
router.get('/auth-url', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const state = `twitter_${userId}_${Date.now()}`;

    const { authUrl, codeVerifier } = twitterService.generateAuthUrl(state);
    codeVerifiers.set(state, codeVerifier);

    // Clean up old verifiers after 10 minutes
    setTimeout(() => {
      codeVerifiers.delete(state);
    }, 10 * 60 * 1000);

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Twitter auth URL:', error);
    res.status(500).json({ error: 'Error generando URL de autorización' });
  }
});

// OAuth callback handler
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error('Twitter OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=twitter_oauth_failed`);
    }

    if (!code || !state || typeof state !== 'string') {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=twitter_oauth_invalid`);
    }

    // Extract user ID from state
    const stateParts = state.split('_');
    if (stateParts.length !== 3 || stateParts[0] !== 'twitter') {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=twitter_oauth_invalid_state`);
    }

    const userId = stateParts[1];
    const codeVerifier = codeVerifiers.get(state);

    if (!codeVerifier) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=twitter_oauth_expired`);
    }

    // Exchange code for token
    const tokenResult = await twitterService.exchangeCodeForToken(code as string, codeVerifier);

    if (!tokenResult.success) {
      console.error('Twitter token exchange failed:', tokenResult.message);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=twitter_token_exchange_failed`);
    }

    // Update user with Twitter credentials
    await prisma.user.update({
      where: { id: userId },
      data: {
        twitterAccessToken: tokenResult.accessToken,
        twitterRefreshToken: tokenResult.refreshToken,
        twitterTokenExpiresAt: tokenResult.expiresAt,
        twitterUserId: tokenResult.userId,
        twitterUsername: tokenResult.username,
        twitterConnectedAt: new Date()
      }
    });

    // Clean up code verifier
    codeVerifiers.delete(state);

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?success=twitter_connected`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=twitter_callback_error`);
  }
});

// Get connection status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twitterUsername: true,
        twitterConnectedAt: true,
        twitterTokenExpiresAt: true
      }
    });

    if (!user?.twitterUsername) {
      return res.json({ connected: false });
    }

    const isExpired = user.twitterTokenExpiresAt && new Date(user.twitterTokenExpiresAt) <= new Date();

    res.json({
      connected: !isExpired,
      username: user.twitterUsername,
      connectedAt: user.twitterConnectedAt,
      expiresAt: user.twitterTokenExpiresAt
    });
  } catch (error) {
    console.error('Error getting Twitter status:', error);
    res.status(500).json({ error: 'Error obteniendo estado de Twitter' });
  }
});

// Disconnect Twitter account
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        twitterAccessToken: null,
        twitterRefreshToken: null,
        twitterTokenExpiresAt: null,
        twitterUserId: null,
        twitterUsername: null,
        twitterConnectedAt: null
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Twitter:', error);
    res.status(500).json({ error: 'Error desconectando Twitter' });
  }
});

export default router;