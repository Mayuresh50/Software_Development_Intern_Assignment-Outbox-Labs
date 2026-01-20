import { redis } from '../config/redis';
import { env } from '../config/env';

export async function checkAndIncrementHourlyLimit(senderEmail: string): Promise<{
  allowed: boolean;
  count: number;
}> {
  if (!env.RATE_LIMIT_ENABLED) {
    return { allowed: true, count: 0 };
  }

  const now = new Date();
  const hourKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
  const key = `email:hourly:${senderEmail}:${hourKey}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 3600);
  }

  if (count > env.MAX_EMAILS_PER_HOUR_PER_SENDER) {
    return { allowed: false, count };
  }

  return { allowed: true, count };
}

export function getNextAvailableTime(): Date {
  const next = new Date();
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}
