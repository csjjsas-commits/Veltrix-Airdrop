import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService.js';

export const getAnalyticsMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = await AnalyticsService.getBasicMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching analytics metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics metrics'
    });
  }
};

export const logAnalyticsEvent = async (req: Request, res: Response) => {
  try {
    const { eventType, properties } = req.body;
    const userId = req.user?.userId || null;

    await AnalyticsService.logEvent(eventType, userId, properties);

    res.json({
      success: true,
      message: 'Event logged successfully'
    });
  } catch (error) {
    console.error('Error logging analytics event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log analytics event'
    });
  }
};