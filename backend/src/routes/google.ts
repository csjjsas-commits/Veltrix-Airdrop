import { Router } from 'express';
import { GoogleOAuthService } from '../services/googleOAuthService';
import prisma from '../utils/prismaClient';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';

const router = Router();
const googleService = new GoogleOAuthService();

const JWT_SECRET: jwt.Secret = env.JWT_SECRET;
const JWT_EXPIRE = env.JWT_EXPIRE;

// Get Google OAuth callback
router.get('/callback', async (req, res) => {
  try {
    console.log('CALLBACK START');

    const { code, error } = req.query;

    console.log('QUERY OK');

    if (error) {
      console.log('GOOGLE ERROR');

      return res.redirect(
        `${env.FRONTEND_URL}/login?error=google_oauth_failed`
      );
    }

    if (!code) {
      console.log('NO CODE');

      return res.redirect(
        `${env.FRONTEND_URL}/login?error=google_oauth_no_code`
      );
    }

    console.log('EXCHANGING TOKEN');

    const tokenResult = await googleService.exchangeCodeForToken(code as string);

    console.log('TOKEN RESULT:', tokenResult.success);

    if (!tokenResult.success || !tokenResult.userInfo) {
      console.log('TOKEN EXCHANGE FAILED');

      return res.redirect(
        `${env.FRONTEND_URL}/login?error=google_oauth_token_exchange_failed`
      );
    }

    const { userInfo } = tokenResult;

    console.log('USER INFO OK');

    let user = await prisma.user.findUnique({
      where: { email: userInfo.email }
    });

    console.log('USER SEARCH DONE');

    if (!user) {
      console.log('CREATING USER');

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
    } else {
      console.log('UPDATING USER');

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
    }

    console.log('GENERATING JWT');

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

    console.log('REDIRECTING');

    res.redirect(
      `${env.FRONTEND_URL}/login?token=${encodeURIComponent(token)}&google_login=true`
    );

  } catch (error) {
    console.error('FULL GOOGLE CALLBACK ERROR:', error);

    res.redirect(
      `${env.FRONTEND_URL}/login?error=google_oauth_callback_error`
    );
  }
});

export default router;
