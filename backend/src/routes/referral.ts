import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import prisma from '../utils/prismaClient.js';
import { env } from '../utils/env.js';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router();

/**
 * GET /api/referral/code
 * Get or generate referral code for current user
 */
router.get('/code', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate referral code if not exists
    let referralCode = user.referralCode;
    if (!referralCode) {
      // Create unique code using first part of UUID
      referralCode = 'REF_' + uuidv4().split('-')[0].toUpperCase();

      await prisma.user.update({
        where: { id: userId },
        data: { referralCode }
      });
    }

    const frontendUrl = env.FRONTEND_URL;
    const referralLink = `${frontendUrl}?ref=${referralCode}`;

    res.json({
      success: true,
      referralCode,
      referralLink,
      userEmail: user.email,
      userName: user.name
    });
  } catch (error) {
    console.error('Error getting referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting referral code'
    });
  }
});

/**
 * GET /api/referral/stats
 * Get referral stats for current user
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Count total referred users
    const totalReferred = await prisma.user.count({
      where: { referredById: userId }
    });

    // Count users who completed at least 1 task
    const validReferrals = await prisma.referralAction.count({
      where: {
        referrerId: userId,
        taskCompleted: true
      }
    });

    // Get list of referred users with their completion status
    const referredUsers = await prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        email: true,
        name: true,
        points: true,
        createdAt: true,
        referralActions: {
          select: {
            taskCompleted: true,
            completedAt: true
          }
        }
      }
    });

    const referralsWithStatus = referredUsers.map(user => ({
      userId: user.id,
      email: user.email,
      name: user.name,
      points: user.points,
      joinedAt: user.createdAt,
      tasksCompleted: user.referralActions.filter(a => a.taskCompleted).length,
      hasCompletedTask: user.referralActions.some(a => a.taskCompleted),
      lastCompletedAt: user.referralActions
        .filter(a => a.taskCompleted)
        .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))[0]
        ?.completedAt
    }));

    res.json({
      success: true,
      totalReferred,
      validReferrals,
      referrals: referralsWithStatus
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting referral statistics'
    });
  }
});

/**
 * POST /api/referral/register
 * Register as a referred user using referral code
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { referralCode, userId } = req.body;

    if (!referralCode || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Referral code and user ID are required'
      });
    }

    // Find referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode }
    });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    // Check if user already has a referrer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredById: true }
    });

    if (user?.referredById) {
      return res.status(400).json({
        success: false,
        message: 'User already has a referrer'
      });
    }

    // Update user with referrer
    await prisma.user.update({
      where: { id: userId },
      data: {
        referredById: referrer.id
      }
    });

    res.json({
      success: true,
      message: 'Referral registered successfully',
      referrerName: referrer.name
    });
  } catch (error) {
    console.error('Error registering referral:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering referral'
    });
  }
});

export default router;
