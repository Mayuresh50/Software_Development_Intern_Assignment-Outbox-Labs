import { Worker, Job } from "bullmq";
import { redisConnection } from "./config/redis";
import { prisma } from "./config/database";
import { env } from "./config/env";
import { sendEmail, initializeEmailService } from "./services/emailService";
import { EmailStatus } from "@prisma/client";

interface EmailJob {
	emailId: string;
}

async function startWorker() {
	await initializeEmailService();

	const concurrency = Number(env.WORKER_CONCURRENCY) || 5;
	const minDelayMs = Number(env.MIN_DELAY_BETWEEN_EMAILS_MS) || 2000;

	const worker = new Worker<EmailJob>(
		"email-queue",
		async (job: Job<EmailJob>) => {
			const email = await prisma.email.findUnique({
				where: { id: job.data.emailId },
			});

			if (!email) return;

			// Already processed → do nothing
			if (
				email.status === EmailStatus.SENT ||
				email.status === EmailStatus.FAILED
			) {
				return;
			}

			try {
				const result = await sendEmail({
					from: email.senderEmail,
					to: email.recipientEmail,
					subject: email.subject,
					html: email.body,
				});

				console.log("📧 Email sent:", result.previewUrl);

				await prisma.email.update({
					where: { id: email.id },
					data: {
						status: EmailStatus.SENT,
						sentAt: new Date(),
					},
				});
			} catch (err) {
				console.error("❌ Email send failed:", err);

				await prisma.email.update({
					where: { id: email.id },
					data: {
						status: EmailStatus.FAILED,
					},
				});

				throw err;
			}
		},
		{
			connection: redisConnection,
			concurrency,
			limiter: {
				max: 1,
				duration: minDelayMs,
			},
		},
	);

	worker.on("completed", (job) => {
		console.log(`✅ Job completed: ${job.id}`);
	});

	worker.on("failed", (job, err) => {
		console.error(`❌ Job failed: ${job?.id}`, err);
	});

	console.log("🚀 Email worker started");
}

startWorker().catch((err) => {
	console.error("Worker startup failed:", err);
	process.exit(1);
});
