import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { redis } from "./config/redis";
import { prisma } from "./config/database";
import { initializeEmailService } from "./services/emailService";
import authRoutes from "./routes/auth";
import emailRoutes from "./routes/emails";

const app = express();

app.set("trust proxy", 1); // 🔹 required on Render

app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"https://outbox-frontend.onrender.com", // ✅ FIXED
		],
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);

app.get("/", (_req, res) => {
	res.send("ReachInbox Backend is running 🚀");
});

app.get("/health", async (_req, res) => {
	await prisma.$queryRaw`SELECT 1`;
	await redis.ping();
	res.json({ status: "ok" });
});

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
