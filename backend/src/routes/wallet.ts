import express, { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import prisma from '../utils/prismaClient';
import { ethers } from 'ethers';

const router: Router = express.Router();

/**
 * GET /api/wallet/message
 * Get a message for the user to sign
 */
router.get('/message', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Generate a unique message for the user to sign
    const message = `Sign this message to verify wallet ownership for Airdrop\nTimestamp: ${Date.now()}\nUser ID: ${userId}`;

    res.json({
      success: true,
      message,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error generating wallet message:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating verification message'
    });
  }
});

/**
 * POST /api/wallet/connect
 * Connect wallet and store signature verification
 */
router.post('/connect', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature, message } = req.body;
    const userId = req.user!.id;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address, signature, and message are required'
      });
    }

    // Verify the signature
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      const normalizedWallet = ethers.getAddress(walletAddress);
      const normalizedRecovered = ethers.getAddress(recoveredAddress);

      if (normalizedWallet !== normalizedRecovered) {
        return res.status(400).json({
          success: false,
          message: 'Signature does not match wallet address'
        });
      }

      // Store wallet connection
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          walletAddress: normalizedWallet,
          walletChain: process.env.WALLET_CHAIN_ID || '1',
          walletConnectedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Wallet connected successfully',
        walletAddress: normalizedWallet
      });
    } catch (error) {
      console.error('Signature verification error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
  } catch (error) {
    console.error('Wallet connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting wallet'
    });
  }
});

/**
 * GET /api/wallet/status
 * Get wallet connection status
 */
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletAddress: true,
        walletChain: true,
        walletConnectedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      connected: !!user.walletAddress,
      walletAddress: user.walletAddress,
      chain: user.walletChain,
      connectedAt: user.walletConnectedAt
    });
  } catch (error) {
    console.error('Error getting wallet status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting wallet status'
    });
  }
});

/**
 * POST /api/wallet/disconnect
 * Disconnect wallet
 */
router.post('/disconnect', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        walletAddress: null,
        walletChain: null,
        walletConnectedAt: null
      }
    });

    res.json({
      success: true,
      message: 'Wallet disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting wallet'
    });
  }
});

export default router;
