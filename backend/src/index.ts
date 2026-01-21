import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { redis } from "./config/redis";
import { prisma } from "./config/database";
import { initializeEmailService } from "./services/emailService";
import authRoutes from "./routes/auth";
import emailRoutes from "./routes/emails";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);

app.get("/health", async (_req, res) => {
	await prisma.$queryRaw`SELECT 1`;
	await redis.ping();
	res.json({ status: "ok" });
});

async function start() {
	await prisma.$connect();
	await initializeEmailService();

	app.listen(env.PORT, () => {
		console.log(`Server running on port ${env.PORT}`);
	});
}

start();
