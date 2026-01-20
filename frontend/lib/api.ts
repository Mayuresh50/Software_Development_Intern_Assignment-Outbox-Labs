const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Email {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string;
  status: 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'RATE_LIMITED';
  failureReason?: string;
  messageId?: string;
  previewUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEmailRequest {
  recipients: string[];
  senderEmail: string;
  subject: string;
  body: string;
  startTime?: string;
  delayBetweenEmails?: number;
  hourlyLimit?: number;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async loginWithGoogle(googleId: string, email: string, name: string, avatar?: string) {
    const data = await this.request<{ token: string; user: User }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ googleId, email, name, avatar }),
    });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request('/api/auth/me');
  }

  async scheduleEmail(data: ScheduleEmailRequest) {
    return this.request<{ message: string; emails: Email[] }>('/api/emails/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScheduledEmails(page = 1, limit = 20) {
    const res = await this.request<any>(
      `/api/emails/scheduled?page=${page}&limit=${limit}`
    );
  
    return {
      emails: Array.isArray(res) ? res : res.emails ?? [],
      pagination: res.pagination ?? null,
    };
  }
  
  async getSentEmails(page = 1, limit = 20) {
    const res = await this.request<any>(
      `/api/emails/sent?page=${page}&limit=${limit}`
    );
  
    return {
      emails: Array.isArray(res) ? res : res.emails ?? [],
      pagination: res.pagination ?? null,
    };
  }
  async getEmail(id: string) {
    return this.request<{ email: Email }>(`/api/emails/${id}`);
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
}

export const api = new ApiClient();
