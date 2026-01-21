import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL, {
	maxRetriesPerRequest: null,
});

export const redisConnection = {
	host: new URL(env.REDIS_URL).hostname,
	port: Number(new URL(env.REDIS_URL).port || 6379),
	password: new URL(env.REDIS_URL).password || undefined,
};

redis.on("connect", () => {
	console.log("Redis connected");
});
