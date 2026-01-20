import { api } from './api';

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  imageUrl?: string;
}

/**
 * Handle Google OAuth callback
 */
export async function handleGoogleAuth(response: any): Promise<void> {
  try {
    const profile = response.profileObj || response;
    
    await api.loginWithGoogle(
      profile.googleId || profile.sub || profile.id,
      profile.email,
      profile.name,
      profile.imageUrl || profile.picture
    );
  } catch (error) {
    console.error('Google auth error:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}

/**
 * Get current user from localStorage
 */
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}
