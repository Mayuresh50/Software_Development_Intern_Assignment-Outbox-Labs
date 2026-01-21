import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { emailQueue } from "../config/queue";
import { authenticateToken } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { EmailStatus } from "@prisma/client";

const router = Router();

const scheduleEmailSchema = z.object({
	senderEmail: z.string().email(),
	recipients: z.array(z.string().email()).min(1),
	subject: z.string().min(1),
	body: z.string().min(1),
	startTime: z.string().optional(),
	delayBetweenEmails: z.number().optional(),
});

router.post("/schedule", authenticateToken, async (req, res: Response) => {
	try {
		const { user } = req as AuthRequest;

		if (!user) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		// 🔒 ENSURE USER EXISTS (FK FIX)
		const existingUser = await prisma.user.findUnique({
			where: { id: user.id },
		});

		if (!existingUser) {
			return res.status(401).json({
				error: "User not found. Please login again.",
			});
		}

		const data = scheduleEmailSchema.parse(req.body);

		const baseTime = data.startTime
			? new Date(data.startTime)
			: new Date(Date.now() + 5000);

		const delay = data.delayBetweenEmails ?? 2000;
		const emails = [];

		for (let i = 0; i < data.recipients.length; i++) {
			const scheduledAt = new Date(baseTime.getTime() + i * delay);

			const email = await prisma.email.create({
				data: {
					userId: existingUser.id,
					senderEmail: data.senderEmail,
					recipientEmail: data.recipients[i],
					subject: data.subject,
					body: data.body,
					status: EmailStatus.SCHEDULED,
					scheduledAt,
				},
			});

			await emailQueue.add(
				"send-email",
				{
					emailId: email.id,
				},
				{
					delay: Math.max(scheduledAt.getTime() - Date.now(), 0),
					jobId: email.id,
				},
			);

			emails.push(email);
		}

		res.status(201).json({
			message: `Scheduled ${emails.length} email(s)`,
			emails,
		});
	} catch (err) {
		console.error("Schedule email error:", err);
		res.status(500).json({ error: "Failed to schedule emails" });
	}
});

router.get("/scheduled", authenticateToken, async (req, res: Response) => {
	const { user } = req as AuthRequest;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const emails = await prisma.email.findMany({
		where: {
			userId: user.id,
			status: "SCHEDULED",
		},
		orderBy: { scheduledAt: "asc" },
	});

	res.json(emails);
});

router.get("/sent", authenticateToken, async (req, res: Response) => {
	const { user } = req as AuthRequest;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const emails = await prisma.email.findMany({
		where: {
			userId: user.id,
			status: { in: ["SENT", "FAILED"] },
		},
		orderBy: { sentAt: "desc" },
	});

	res.json(emails);
});

export default router;
