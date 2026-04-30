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

// Google OAuth callback
router.get('/callback', async (req, res) => {
  console.log('GOOGLE CALLBACK HIT');

  res.json({
    success: true,
    query: req.query
  });
});

export default router;
