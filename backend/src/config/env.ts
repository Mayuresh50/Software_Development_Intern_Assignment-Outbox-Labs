import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env variable: ${key}`);
  }
  return value;
}

function number(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required env variable: ${key}`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number env variable: ${key}`);
  }
  return parsed;
}

export const env = {
  PORT: number('PORT', 4000),
  NODE_ENV: process.env.NODE_ENV || 'development',

  DATABASE_URL: required('DATABASE_URL'),
  REDIS_URL: required('REDIS_URL'),

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],

  WORKER_CONCURRENCY: number('WORKER_CONCURRENCY', 5),
  MIN_DELAY_BETWEEN_EMAILS_MS: number('MIN_DELAY_BETWEEN_EMAILS_MS', 2000),

  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED === 'true',
  MAX_EMAILS_PER_HOUR_PER_SENDER: number(
    'MAX_EMAILS_PER_HOUR_PER_SENDER',
    200
  ),
};
