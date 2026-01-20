'use client';

import { Email } from '@/lib/api';

interface EmailListProps {
  emails: Email[];
  loading?: boolean;
}

export function EmailList({ emails, loading }: EmailListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No emails found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <div
          key={email.id}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{email.subject}</h3>
              <p className="text-sm text-gray-600 mt-1">
                To: {email.recipientEmail}
              </p>
              <p className="text-sm text-gray-600">
                From: {email.senderEmail}
              </p>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                email.status === 'SENT'
                  ? 'bg-green-100 text-green-800'
                  : email.status === 'FAILED'
                  ? 'bg-red-100 text-red-800'
                  : email.status === 'RATE_LIMITED'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {email.status}
            </span>
          </div>

          <p className="text-sm text-gray-700 line-clamp-2">{email.body}</p>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <div>
              {email.sentAt ? (
                <span>Sent: {new Date(email.sentAt).toLocaleString()}</span>
              ) : (
                <span>Scheduled: {new Date(email.scheduledAt).toLocaleString()}</span>
              )}
            </div>
            {email.previewUrl && (
              <a
                href={email.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Preview
              </a>
            )}
          </div>

          {email.failureReason && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              Error: {email.failureReason}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
