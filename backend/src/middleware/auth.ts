import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthUser {
	id: string;
	email: string;
	name: string;
}

export interface AuthRequest extends Request {
	user?: AuthUser;
}

export function authenticateToken(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const authHeader = req.headers.authorization;
	const token = authHeader?.split(" ")[1];

	if (!token) {
		res.status(401).json({ error: "Authentication required" });
		return;
	}

	try {
		const decoded = jwt.verify(token, env.JWT_SECRET) as {
			userId: string;
			email: string;
			name: string;
		};

		(req as AuthRequest).user = {
			id: decoded.userId,
			email: decoded.email,
			name: decoded.name,
		};

		next();
	} catch {
		res.status(401).json({ error: "Invalid or expired token" });
	}
}
