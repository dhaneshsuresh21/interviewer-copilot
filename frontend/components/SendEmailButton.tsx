'use client';

import { useState } from 'react';
import { Mail, Check, X } from 'lucide-react';

interface SendEmailButtonProps {
  sessionId: string;
  candidateName: string;
  candidateEmail?: string;
  compact?: boolean; // New prop for compact mode
}

export default function SendEmailButton({ sessionId, candidateName, candidateEmail, compact = false }: SendEmailButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendEmail = async () => {
    if (!email.trim()) {
      setResult({ success: false, message: 'Please enter an email address' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({ success: true, message: data.message || 'Email sent successfully!' });
        setTimeout(() => {
          setShowModal(false);
          setResult(null);
        }, 2000);
      } else {
        setResult({ success: false, message: data.error || 'Failed to send email' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors text-sm"
          title="Send feedback email"
        >
          <Mail size={16} />
        </button>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Send Feedback Email</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-400 text-sm mb-4">
                Send the interview feedback report for <span className="text-white font-medium">{candidateName}</span>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  disabled={sending}
                />
              </div>

              {result && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                  result.success 
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {result.success ? <Check size={18} /> : <X size={18} />}
                  <span className="text-sm">{result.message}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSendEmail}
                  disabled={sending || !email.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  <Mail size={18} />
                  {sending ? 'Sending...' : 'Send Email'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={sending}
                  className="px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Note: Email functionality requires SendGrid API key configuration in backend.
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-lg shadow-purple-500/20 transition-colors"
      >
        <Mail size={18} />
        Send Email
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Send Feedback Email</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Send the interview feedback report for <span className="text-white font-medium">{candidateName}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                disabled={sending}
              />
            </div>

            {result && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                result.success 
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {result.success ? <Check size={18} /> : <X size={18} />}
                <span className="text-sm">{result.message}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSendEmail}
                disabled={sending || !email.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed font-medium transition-colors"
              >
                <Mail size={18} />
                {sending ? 'Sending...' : 'Send Email'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={sending}
                className="px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Note: Email functionality requires SendGrid API key configuration in backend.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
