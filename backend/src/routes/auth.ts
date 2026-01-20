import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * Google OAuth callback endpoint
 * In production, this would be handled by Google OAuth flow
 * For now, we'll accept user info and create/update user
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    console.log('AUTH BODY:', req.body);
    console.log('JWT_SECRET AT RUNTIME:', env.JWT_SECRET);

    const { googleId, email, name, avatar } = req.body;

    let user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          name,
          avatar,
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { email },
        data: { googleId },
      });
    }
    // console.log('USER:', user);
    // console.log('JWT_SECRET AT RUNTIME:', env.JWT_SECRET);  

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN,
      }
    );
    
    

    return res.json({ token, user });
  } catch (error) {
    console.error('🔥 AUTH ERROR (REAL):', error);
    return res.status(500).json({
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
/**
 * Get current user
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
