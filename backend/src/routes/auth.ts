import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

/**
 * Mock Google login
 */
router.post("/google", async (req: Request, res: Response) => {
	const { googleId, email, name, avatar } = req.body;

	if (!email || !name) {
		return res.status(400).json({ error: "Invalid payload" });
	}

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
	}

	const token = jwt.sign(
		{
			userId: user.id,
			email: user.email,
			name: user.name,
		},
		env.JWT_SECRET,
		{ expiresIn: env.JWT_EXPIRES_IN },
	);

	res.json({ token, user });
});

router.get("/me", authenticateToken, async (req, res) => {
	const { user } = req as AuthRequest;

	if (!user) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: {
			id: true,
			email: true,
			name: true,
			avatar: true,
		},
	});

	res.json({ user: dbUser });
});

export default router;
