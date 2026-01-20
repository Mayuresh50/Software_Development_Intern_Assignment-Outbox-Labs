import { Worker, Job } from 'bullmq';
import { redis } from './config/redis';
import { prisma } from './config/database';
import { env } from './config/env';
import { sendEmail, initializeEmailService } from './services/emailService';
import {
  checkAndIncrementHourlyLimit,
  getNextAvailableTime,
} from './services/rateLimiter';

interface EmailJob {
  emailId: string;
}

async function startWorker() {
  await initializeEmailService();

  const concurrency = Number(env.WORKER_CONCURRENCY);
  const minDelayMs = Number(env.MIN_DELAY_BETWEEN_EMAILS_MS);

  if (!Number.isFinite(concurrency) || concurrency <= 0) {
    throw new Error('Invalid WORKER_CONCURRENCY');
  }

  if (!Number.isFinite(minDelayMs) || minDelayMs <= 0) {
    throw new Error('Invalid MIN_DELAY_BETWEEN_EMAILS_MS');
  }

  const worker = new Worker<EmailJob>(
    'email-queue',
    async (job: Job<EmailJob>) => {
      const email = await prisma.email.findUnique({
        where: { id: job.data.emailId },
      });

      if (!email || email.status === 'SENT') return;

      // Rate limit check
      const rate = await checkAndIncrementHourlyLimit(email.senderEmail);

      if (!rate.allowed) {
        const nextTime = await getNextAvailableTime(email.senderEmail);

        await prisma.email.update({
          where: { id: email.id },
          data: {
            status: 'SCHEDULED',
            scheduledAt: nextTime,
          },
        });

        await job.moveToDelayed(nextTime.getTime());
        return;
      }

      await prisma.email.update({
        where: { id: email.id },
        data: { status: 'SENDING' },
      });

      const result = await sendEmail({
        from: email.senderEmail,
        to: email.recipientEmail,
        subject: email.subject,
        html: email.body,
      });

      console.log('📧 Email sent:', result.previewUrl);

      await prisma.email.update({
        where: { id: email.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    },
    {
      connection: redis,
      concurrency,
      limiter: {
        max: 1,
        duration: minDelayMs,
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job completed: ${job.id}`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`❌ Job failed: ${job?.id}`, err);

    if (job?.data?.emailId) {
      await prisma.email.update({
        where: { id: job.data.emailId },
        data: {
          status: 'FAILED',
        },
      });
    }
  });

  console.log('🚀 Email worker started');
}

startWorker().catch((err) => {
  console.error('Worker startup failed:', err);
  process.exit(1);
});
