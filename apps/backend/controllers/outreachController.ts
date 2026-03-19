import { Request, Response } from 'express';
import { emailOutreach } from '../../../src/backend/outreach/emailOutreach.js';
import { analytics, errorMonitor } from '../observability/monitor.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const sendEmail = async (req: AuthRequest, res: Response) => {
  const { to, subject, body, leadId } = req.body;
  const userId = req.user?.id;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject, and body are required' });
  }

  try {
    analytics.capture({
      userId,
      event: 'email_sending_triggered',
      properties: { to, subject, leadId }
    });

    const result = await emailOutreach.sendEmail({
      to,
      subject,
      body,
      leadId,
      userId
    });

    if (result.success) {
      analytics.capture({
        userId,
        event: 'email_sent_successfully',
        properties: { to, leadId, messageId: result.messageId }
      });
    }

    res.json(result);
  } catch (error: any) {
    errorMonitor.captureException(error, 'sendEmail');
    res.status(500).json({ error: error.message });
  }
};
