import { Router } from 'express';
import { TelegramService } from '../services/verification/telegram.service';
import { VerificationService } from '../services/verificationService';
import { TaskVerificationTypes } from '../services/verification/types';
import prisma from '../utils/prismaClient';

const router = Router();
const telegramService = new TelegramService();

// Webhook endpoint for Telegram bot updates
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const result = await telegramService.handleBotCallback(update.callback_query);

      if (result.success && result.userId) {
        // Find and complete the bot verification task for this user
        const tasks = await prisma.task.findMany({
          where: {
            verificationType: TaskVerificationTypes.TELEGRAM_BOT_VERIFY,
            active: true
          },
          include: {
            userTasks: {
              where: {
                userId: result.userId,
                status: { in: ['PENDING', 'IN_PROGRESS'] }
              }
            }
          }
        });

        // Complete the first pending bot verification task
        for (const task of tasks) {
          if (task.userTasks.length > 0) {
            const userTask = task.userTasks[0];

            // Update the user task as completed
            await prisma.userTask.update({
              where: { id: userTask.id },
              data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                pointsAwarded: task.points,
                verificationMetadata: JSON.stringify({
                  verifiedAt: new Date().toISOString(),
                  method: 'telegram_bot_callback'
                })
              }
            });

            // Update user points
            await prisma.user.update({
              where: { id: result.userId },
              data: {
                points: {
                  increment: task.points
                }
              }
            });

            break; // Only complete one task
          }
        }
      }

      res.json({ success: true });
      return;
    }

    // Handle other update types if needed
    res.json({ success: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// Endpoint to get bot info (for admin)
router.get('/bot-info', async (req, res) => {
  try {
    const botInfo = await telegramService.getBotInfo();
    if (botInfo && botInfo.ok) {
      res.json({
        success: true,
        data: {
          id: botInfo.result.id,
          username: botInfo.result.username,
          firstName: botInfo.result.first_name,
          canJoinGroups: botInfo.result.can_join_groups,
          canReadAllGroupMessages: botInfo.result.can_read_all_group_messages,
          supportsInlineQueries: botInfo.result.supports_inline_queries
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Bot not configured or API error'
      });
    }
  } catch (error) {
    console.error('Error getting bot info:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving bot information'
    });
  }
});

// Endpoint to set webhook URL
router.post('/set-webhook', async (req, res) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL is required'
      });
    }

    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['callback_query', 'message']
      })
    });

    const data = await response.json();

    if (data.ok) {
      res.json({
        success: true,
        message: 'Webhook set successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: data.description || 'Failed to set webhook'
      });
    }
  } catch (error) {
    console.error('Error setting webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting webhook'
    });
  }
});

export default router;