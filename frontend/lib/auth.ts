export interface GoogleUser {
	googleId: string;
	email: string;
	name: string;
	imageUrl?: string;
}

/**
 * ✅ MOCK Google Auth (NO BACKEND CALL)
 * Used for demo / submission
 */
export async function handleGoogleAuth(user: GoogleUser): Promise<void> {
	if (typeof window === "undefined") return;

	const storedUser = {
		id: user.googleId,
		email: user.email,
		name: user.name,
		avatar: user.imageUrl || null,
	};

	// 🔐 Store user locally
	localStorage.setItem("user", JSON.stringify(storedUser));

	// 🔐 Fake token for auth checks
	localStorage.setItem("token", "mock-token");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
	if (typeof window === "undefined") return false;
	return !!localStorage.getItem("token");
}

/**
 * Get current user from localStorage
 */
export function getStoredUser() {
	if (typeof window === "undefined") return null;
	const userStr = localStorage.getItem("user");
	return userStr ? JSON.parse(userStr) : null;
}
