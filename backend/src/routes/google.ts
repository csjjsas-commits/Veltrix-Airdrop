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

// Test route to verify Google OAuth endpoint exists
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Google OAuth endpoint is working',
    timestamp: new Date().toISOString(),
    route: '/api/auth/google/test'
  });
});

// Google OAuth callback
router.get('/callback', async (req, res) => {
  console.log('🔄 GOOGLE CALLBACK HIT - Full URL:', req.originalUrl);
  console.log('🔄 Query params:', JSON.stringify(req.query, null, 2));

  try {
    console.log('🔄 Processing OAuth response...');

    const { code, error } = req.query;

    if (error) {
      console.log('❌ Google OAuth error:', error);
      return res.redirect(
        `${env.FRONTEND_URL}/login?error=google_oauth_failed`
      );
    }

    if (!code) {
      console.log('❌ No authorization code received');
      return res.redirect(
        `${env.FRONTEND_URL}/login?error=google_oauth_no_code`
      );
    }

    console.log('🔄 Exchanging code for tokens...');

    const tokenResult = await googleService.exchangeCodeForToken(code as string);

    console.log('🔄 Token exchange result:', tokenResult.success ? 'SUCCESS' : 'FAILED');

    if (!tokenResult.success || !tokenResult.userInfo) {
      console.log('❌ Token exchange failed:', tokenResult);
      return res.redirect(
        `${env.FRONTEND_URL}/login?error=google_oauth_token_exchange_failed`
      );
    }

    const { userInfo } = tokenResult;

    console.log('✅ User info received:', { email: userInfo.email, name: userInfo.name });

    let user = await prisma.user.findUnique({
      where: { email: userInfo.email }
    });

    console.log('🔄 User lookup result:', user ? 'EXISTING USER' : 'NEW USER');

    if (!user) {
      console.log('👤 Creating new user...');
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          password: '',
          googleId: userInfo.id,
          googleAccessToken: tokenResult.accessToken,
          googleRefreshToken: tokenResult.refreshToken,
          googleTokenExpiresAt: tokenResult.expiresIn
            ? new Date(Date.now() + (tokenResult.expiresIn * 1000))
            : undefined,
          avatar: userInfo.picture,
          emailVerified: true,
        }
      });
      console.log('✅ New user created with ID:', user.id);
    } else {
      console.log('👤 Updating existing user...');
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: userInfo.id,
          googleAccessToken: tokenResult.accessToken,
          googleRefreshToken: tokenResult.refreshToken,
          googleTokenExpiresAt: tokenResult.expiresIn
            ? new Date(Date.now() + (tokenResult.expiresIn * 1000))
            : undefined,
          name: userInfo.name,
          avatar: userInfo.picture,
          emailVerified: true,
        }
      });
      console.log('✅ Existing user updated');
    }

    console.log('🔄 Generating JWT token...');

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRE as unknown as jwt.SignOptions['expiresIn']
      }
    );

    console.log('✅ JWT token generated');

    const redirectUrl = `${env.FRONTEND_URL}/login?token=${encodeURIComponent(token)}&google_login=true`;
    console.log('🔄 Redirecting to:', redirectUrl);

    res.redirect(redirectUrl);

  } catch (error) {
    console.error('💥 FULL GOOGLE CALLBACK ERROR:', error);
    res.redirect(
      `${env.FRONTEND_URL}/login?error=google_oauth_callback_error`
    );
  }
});

export default router;
