import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createSupportTicket, getUserTickets } from '../../services/ledgerService';
import { Headphones, Send, MessageSquare, Clock, CheckCircle } from 'lucide-react';

export const SupportView: React.FC = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState<'Account' | 'Deposit' | 'Withdrawal' | 'Trading' | 'Technical' | 'Other'>('Deposit');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  const tickets = getUserTickets(user.userId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    createSupportTicket({
      userId: user.userId,
      userEmail: user.email,
      category,
      message,
    });

    setMessage('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <Headphones className="w-6 h-6 text-blue-600" /> Support Desk &amp; Resolution
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Open inquiries directly with exchange compliance officers and trading desk engineers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Ticket Creation Form */}
        <div className="md:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" /> Submit New Ticket
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Inquiry Category</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="Deposit">Deposit &amp; Blockchain Confirmations</option>
                <option value="Withdrawal">Withdrawals &amp; Bank Wire</option>
                <option value="Trading">Trading &amp; Matching Engine</option>
                <option value="Account">Account Security &amp; Identity</option>
                <option value="Technical">API &amp; Technical Inquiries</option>
                <option value="Other">General Inquiries</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Detailed Message</label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your inquiry with reference to transaction hashes, order IDs, or timestamps..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:outline-none focus:border-blue-500 resize-none font-mono-numbers"
                required
              />
            </div>

            {submitted && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Ticket submitted! An administrator will review your request.
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wider uppercase shadow-md shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit Support Ticket
            </button>
          </form>
        </div>

        {/* Previous Tickets List */}
        <div className="md:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 text-xs">
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Your Support Tickets ({tickets.length})
            </h2>

            <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
              {tickets.length === 0 ? (
                <div className="py-14 text-center text-slate-400">
                  You have no active support tickets.
                </div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between font-mono-numbers">
                      <span className="font-bold text-slate-900">{t.id}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.status === 'OPEN'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="text-xs text-blue-700 font-semibold">Category: {t.category}</div>
                    <p className="text-slate-700 text-xs line-clamp-2">{t.message}</p>

                    {t.adminResponse && (
                      <div className="mt-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-slate-800">
                        <strong className="block text-[10px] uppercase tracking-wider mb-0.5 text-blue-900 font-bold">
                          Official Exchange Response:
                        </strong>
                        <p className="text-xs text-slate-700">{t.adminResponse}</p>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono-numbers pt-1">
                      Submitted: {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
