'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GoogleButton from 'react-google-button';
import { api, User } from '@/lib/api';
import { handleGoogleAuth, getStoredUser } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if already logged in
    if (getStoredUser()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleGoogleLogin = async (response: any) => {
    setLoading(true);
    setError(null);

    try {
      await handleGoogleAuth(response);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  // Mock Google OAuth for development
  // In production, use proper Google OAuth flow
  const handleMockLogin = () => {
    handleGoogleLogin({
      googleId: 'mock-user-123',
      email: 'user@example.com',
      name: 'Test User',
      imageUrl: 'https://via.placeholder.com/150',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ReachInbox</h1>
          <p className="text-gray-600">Email Scheduling Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <GoogleButton
            onClick={handleMockLogin}
            disabled={loading}
            label={loading ? 'Signing in...' : 'Sign in with Google'}
            type="light"
          />
          
          <p className="text-xs text-center text-gray-500 mt-4">
            For development: Click to use mock authentication
          </p>
        </div>
      </div>
    </div>
  );
}
