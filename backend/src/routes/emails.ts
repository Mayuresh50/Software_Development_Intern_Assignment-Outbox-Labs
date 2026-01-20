import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { scheduleEmail } from '../services/emailService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * Request validation schema
 */
const scheduleEmailSchema = z.object({
  senderEmail: z.string().email(),
  recipients: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
});

/**
 * POST /api/emails/schedule
 */
router.post(
  '/schedule',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const data = scheduleEmailSchema.parse(req.body);

      const scheduledAt = data.scheduledAt
        ? new Date(data.scheduledAt)
        : new Date();

      // Schedule emails one by one
      for (const recipientEmail of data.recipients) {
        await scheduleEmail({
          userId: req.userId!,   // ✅ THIS WAS MISSING
          senderEmail: data.senderEmail,
          recipientEmail,
          subject: data.subject,
          body: data.body,
          scheduledAt,
        });
        
      }

      return res.status(201).json({
        message: `Scheduled ${data.recipients.length} email(s)`,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: err.errors,
        });
      }

      console.error('Schedule email error:', err);
      return res.status(500).json({
        error: 'Failed to schedule emails',
      });
    }
  }
);

/**
 * GET /api/emails/scheduled
 */
router.get(
  '/scheduled',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const emails = await prisma.email.findMany({
        where: {
          status: 'SCHEDULED',
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      });

      return res.json(emails);
    } catch (err) {
      console.error('Get scheduled emails error:', err);
      return res.status(500).json({
        error: 'Failed to fetch scheduled emails',
      });
    }
  }
);

/**
 * GET /api/emails/sent
 */
router.get(
  '/sent',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const emails = await prisma.email.findMany({
        where: {
          status: { in: ['SENT', 'FAILED'] },
        },
        orderBy: {
          sentAt: 'desc',
        },
      });

      return res.json(emails);
    } catch (err) {
      console.error('Get sent emails error:', err);
      return res.status(500).json({
        error: 'Failed to fetch sent emails',
      });
    }
  }
);

export default router;
