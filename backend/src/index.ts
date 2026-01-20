import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { redis } from './config/redis';
import { prisma } from './config/database';
import { initializeEmailService } from './services/emailService';
import authRoutes from './routes/auth';
import emailRoutes from './routes/emails';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);

// Health check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: 'Service unavailable',
    });
  }
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Start server
async function start() {
  try {
    // ❌ DO NOT call redis.connect()
    // Redis is already connected via ioredis constructor

    // Optional: ensure Prisma is ready
    await prisma.$connect();

    // Initialize Ethereal email service
    await initializeEmailService();

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
