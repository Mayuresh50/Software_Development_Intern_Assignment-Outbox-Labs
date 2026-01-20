import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const emailQueue = new Queue('email-queue', {
  connection: redisConnection,

  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60,
    },
  },
});

const shutdown = async () => {
  await emailQueue.close();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('beforeExit', shutdown);
