'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as Tabs from '@radix-ui/react-tabs';
import { api, Email, User } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { ComposeEmailModal } from '@/components/ComposeEmailModal';
import { EmailList } from '@/components/EmailList';

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [sentLoading, setSentLoading] = useState(false);
  const [composeModalOpen, setComposeModalOpen] = useState(false);

  // ✅ Single source of truth
  const loadEmails = useCallback(async () => {
    try {
      setScheduledLoading(true);
      setSentLoading(true);

      const [scheduledRes, sentRes] = await Promise.all([
        api.getScheduledEmails(),
        api.getSentEmails(),
      ]);

      setScheduledEmails(Array.isArray(scheduledRes.emails) ? scheduledRes.emails : []);
      setSentEmails(Array.isArray(sentRes.emails) ? sentRes.emails : []);
    } catch (err) {
      console.error('❌ Failed to load emails', err);
      setScheduledEmails([]);
      setSentEmails([]);
    } finally {
      setScheduledLoading(false);
      setSentLoading(false);
      setLoading(false);
    }
  }, []);

  // ✅ Load user once
  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      router.replace('/');
      return;
    }

    setUser(storedUser);
    loadEmails();
  }, [router, loadEmails]);

  const handleLogout = () => {
    api.logout();
    router.replace('/');
  };

  const handleComposeSuccess = async () => {
    // 🔥 THIS WAS MISSING LOGIC
    await loadEmails();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">ReachInbox</h1>

          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || '/default-avatar.jpg'}
              alt="User"
              className="w-10 h-10 rounded-full"
              onError={(e) => {
                e.currentTarget.src = '/default-avatar.jpg';
              }}
            />

            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <button
            onClick={() => setComposeModalOpen(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Compose Email
          </button>
        </div>

        <Tabs.Root defaultValue="scheduled">
          <Tabs.List className="flex gap-6 border-b mb-4">
            <Tabs.Trigger value="scheduled">
              Scheduled ({scheduledEmails.length})
            </Tabs.Trigger>
            <Tabs.Trigger value="sent">
              Sent ({sentEmails.length})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="scheduled">
            <EmailList emails={scheduledEmails} loading={scheduledLoading} />
          </Tabs.Content>

          <Tabs.Content value="sent">
            <EmailList emails={sentEmails} loading={sentLoading} />
          </Tabs.Content>
        </Tabs.Root>
      </main>

      <ComposeEmailModal
        open={composeModalOpen}
        onOpenChange={setComposeModalOpen}
        onSuccess={handleComposeSuccess}
      />
    </div>
  );
}
