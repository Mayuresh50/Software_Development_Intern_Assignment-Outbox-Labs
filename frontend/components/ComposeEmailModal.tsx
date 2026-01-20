'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { api } from '@/lib/api';

interface ComposeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ComposeEmailModal({
  open,
  onOpenChange,
  onSuccess,
}: ComposeEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    senderEmail: '',
    subject: '',
    body: '',
    recipients: [] as string[],
    recipientInput: '',
    startTime: '',
    delayBetweenEmails: 2000,
    hourlyLimit: 200,
  });

  /* =========================
     Helpers
  ========================= */

  const addRecipient = () => {
    const email = formData.recipientInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.includes(email)
        ? prev.recipients
        : [...prev.recipients, email],
      recipientInput: '',
    }));
  };

  const removeRecipient = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((e) => e !== email),
    }));
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const emails = text
      .split(/[,\n\r]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    setFormData((prev) => {
      const uniqueRecipients = Array.from(
        new Set<string>([...prev.recipients, ...emails])
      );

      return {
        ...prev,
        recipients: uniqueRecipients,
      };
    });
  };

  /* =========================
     Submit
  ========================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    if (
      !formData.senderEmail ||
      !formData.subject ||
      !formData.body ||
      formData.recipients.length === 0
    ) {
      setError('All required fields must be filled');
      return;
    }

    try {
      setLoading(true);

      await api.scheduleEmail({
        senderEmail: formData.senderEmail,
        recipients: formData.recipients,
        subject: formData.subject,
        body: formData.body,
        startTime: formData.startTime
          ? new Date(formData.startTime).toISOString()
          : undefined,
        delayBetweenEmails: formData.delayBetweenEmails,
        hourlyLimit: formData.hourlyLimit,
      });

      onSuccess();
      onOpenChange(false);

      setFormData({
        senderEmail: '',
        subject: '',
        body: '',
        recipients: [],
        recipientInput: '',
        startTime: '',
        delayBetweenEmails: 2000,
        hourlyLimit: 200,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to schedule email'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl">

          <Dialog.Title className="text-xl font-bold mb-4">
            Compose Email
          </Dialog.Title>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Sender Email *"
              required
              value={formData.senderEmail}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  senderEmail: e.target.value,
                }))
              }
              className="w-full border p-2 rounded"
            />

            <input
              type="text"
              placeholder="Subject *"
              required
              value={formData.subject}
              onChange={(e) =>
                setFormData((p) => ({ ...p, subject: e.target.value }))
              }
              className="w-full border p-2 rounded"
            />

            <textarea
              placeholder="Email body *"
              required
              rows={5}
              value={formData.body}
              onChange={(e) =>
                setFormData((p) => ({ ...p, body: e.target.value }))
              }
              className="w-full border p-2 rounded"
            />

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="recipient@example.com"
                value={formData.recipientInput}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    recipientInput: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRecipient();
                  }
                }}
                className="flex-1 border p-2 rounded"
              />
              <button
                type="button"
                onClick={addRecipient}
                className="px-4 bg-blue-500 text-white rounded"
              >
                Add
              </button>
            </div>

            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
            />

            {formData.recipients.length > 0 && (
              <div className="bg-gray-50 p-2 rounded text-sm">
                <p className="mb-1 font-medium">
                  {formData.recipients.length} recipient(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.recipients.map((email) => (
                    <span
                      key={email}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded flex items-center gap-1"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) =>
                setFormData((p) => ({ ...p, startTime: e.target.value }))
              }
              className="w-full border p-2 rounded"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Scheduling…' : 'Schedule Emails'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
