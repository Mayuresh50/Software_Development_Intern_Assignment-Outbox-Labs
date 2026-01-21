import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL, {
	maxRetriesPerRequest: null, // REQUIRED for BullMQ on Render
	enableReadyCheck: false, // REQUIRED for Render Key Value
	retryStrategy: (times) => {
		return Math.min(times * 50, 2000);
	},
});

export const redisConnection = {
	host: new URL(env.REDIS_URL).hostname,
	port: Number(new URL(env.REDIS_URL).port || 6379),
	password: new URL(env.REDIS_URL).password || undefined,
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
};

redis.on("connect", () => {
	console.log("Redis connected");
});

redis.on("error", (err) => {
	console.error("Redis error:", err.message);
});
