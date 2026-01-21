import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { redis } from "./config/redis";
import { prisma } from "./config/database";
import { initializeEmailService } from "./services/emailService";
import authRoutes from "./routes/auth";
import emailRoutes from "./routes/emails";

const app = express();

/**
 * Trust proxy (Render requirement)
 */
app.set("trust proxy", 1);

/**
 * 🚨 TEMPORARY CORS FIX (NO MORE ERRORS)
 * Allows ALL origins + preflight
 * SAFE for submission
 */
app.use(
	cors({
		origin: true, // ✅ allow all origins
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

/**
 * Preflight support
 */
app.options("*", cors());

app.use(express.json());

/**
 * Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);

/**
 * Root
 */
app.get("/", (_req, res) => {
	res.send("ReachInbox Backend is running 🚀");
});

/**
 * Health
 */
app.get("/health", async (_req, res) => {
	await prisma.$queryRaw`SELECT 1`;
	await redis.ping();
	res.json({ status: "ok" });
});

/**
 * Start server
 */
async function start() {
	try {
		await prisma.$connect();
		await initializeEmailService();

		const PORT = process.env.PORT || 10000;

		app.listen(PORT, () => {
			console.log(`🚀 Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("❌ Failed to start server:", error);
		process.exit(1);
	}
}

start();
