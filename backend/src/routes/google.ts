import { Router } from 'express';
import { GoogleOAuthService } from '../services/googleOAuthService';
import prisma from '../utils/prismaClient';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';

const router = Router();
const googleService = new GoogleOAuthService();

const JWT_SECRET: jwt.Secret = env.JWT_SECRET;
const JWT_EXPIRE = env.JWT_EXPIRE;

// Get Google OAuth URL
router.get('/auth-url', (req, res) => {
  try {
    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = googleService.generateAuthUrl(state);

    // Store state in session or temporary storage for verification
    // For now, we'll just return the URL

    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating auth URL'
    });
  }
});

// Google OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, error, state } = req.query;

    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=google_oauth_failed`);
    }

    if (!code) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=google_oauth_no_code`);
    }

    // Exchange code for tokens and user info
    const tokenResult = await googleService.exchangeCodeForToken(code as string);

    if (!tokenResult.success || !tokenResult.userInfo) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=google_oauth_token_exchange_failed`);
    }

    const { userInfo } = tokenResult;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          password: '', // Google OAuth users don't need password
          googleId: userInfo.id,
          googleAccessToken: tokenResult.accessToken,
          googleRefreshToken: tokenResult.refreshToken,
          googleTokenExpiresAt: tokenResult.expiresIn ? new Date(Date.now() + (tokenResult.expiresIn * 1000)) : undefined,
          avatar: userInfo.picture,
          emailVerified: true, // Google accounts are pre-verified
        }
      });
    } else {
      // Update existing user with Google info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: userInfo.id,
          googleAccessToken: tokenResult.accessToken,
          googleRefreshToken: tokenResult.refreshToken,
          googleTokenExpiresAt: tokenResult.expiresIn ? new Date(Date.now() + (tokenResult.expiresIn * 1000)) : undefined,
          name: userInfo.name,
          avatar: userInfo.picture,
          emailVerified: true,
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE as unknown as jwt.SignOptions['expiresIn'] }
    );

    // Redirect to frontend with token
   res.redirect(
  `${env.FRONTEND_URL}/login?token=${encodeURIComponent(token)}&google_login=true`
);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${env.FRONTEND_URL}/login?error=google_oauth_callback_error`);
  }
});

export default router;
