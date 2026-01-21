"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GoogleButton from "react-google-button";
import { handleGoogleAuth, getStoredUser } from "@/lib/auth";

export default function LoginPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (getStoredUser()) {
			router.push("/dashboard");
		}
	}, [router]);

	// ✅ MOCK LOGIN ONLY (INTENTIONAL)
	const handleMockLogin = async () => {
		setLoading(true);
		setError(null);

		try {
			await handleGoogleAuth({
				googleId: "mock-user-123",
				email: "user@example.com",
				name: "Test User",
				imageUrl: "https://via.placeholder.com/150",
			});

			router.push("/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						ReachInbox
					</h1>
					<p className="text-gray-600">Email Scheduling Platform</p>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
						{error}
					</div>
				)}

				<GoogleButton
					onClick={handleMockLogin}
					disabled={loading}
					label={loading ? "Signing in..." : "Sign in with Google"}
				/>

				<p className="text-xs text-center text-gray-500 mt-4">
					Mock authentication enabled for demo
				</p>
			</div>
		</div>
	);
}
