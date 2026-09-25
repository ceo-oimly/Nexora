import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminStats,
  getAllUsers,
  updateUserStatus,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getAllTickets,
  answerTicket,
  getAuditLogs,
  getAllTransactions,
  getDepositSetting,
  updateDepositSetting,
  getAllDeposits,
  approveDeposit,
  rejectDeposit,
} from '../../services/ledgerService';
import {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToAdminNotifications,
  getAdminEmailAddress,
} from '../../services/notificationService';
import { DepositSetting, DepositRequest, AdminNotification } from '../../types/exchange';
import {
  ShieldAlert,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  MessageSquare,
  FileText,
  Lock,
  QrCode,
  Upload,
  Check,
  Save,
  Wallet,
  Mail,
  ExternalLink,
  Copy,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'alerts' | 'users' | 'transactions' | 'support' | 'audit'>('deposits');
  const [userSearch, setUserSearch] = useState('');
  const [ticketReply, setTicketReply] = useState<{ id: string; text: string }>({ id: '', text: '' });
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deposit Config State
  const initialSetting = getDepositSetting('BTC');
  const [btcWalletAddress, setBtcWalletAddress] = useState(initialSetting.walletAddress);
  const [depositInstructions, setDepositInstructions] = useState(initialSetting.instructions || '');
  const [qrCodeUrl, setQrCodeUrl] = useState(initialSetting.qrCodeUrl || '');
  const [qrPreview, setQrPreview] = useState(initialSetting.qrCodeUrl || '');
  const [savingConfig, setSavingConfig] = useState(false);

  // Real-time Admin Notifications
  const [notifications, setNotifications] = useState<AdminNotification[]>(getAdminNotifications());
  const adminEmail = getAdminEmailAddress();

  useEffect(() => {
    const unsubscribe = subscribeToAdminNotifications((items) => {
      setNotifications(items);
    });
    return unsubscribe;
  }, []);

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-14 p-8 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-xl">
        <Lock className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          This portal is restricted exclusively to authorized NEXORA exchange administrators.
        </p>
      </div>
    );
  }

  const stats = getAdminStats();
  const users = getAllUsers().filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.userId.toLowerCase().includes(userSearch.toLowerCase())
  );
  const withdrawals = getAllWithdrawals();
  const deposits = getAllDeposits();
  const tickets = getAllTickets();
  const auditLogs = getAuditLogs();
  const transactions = getAllTransactions();

  const pendingDeposits = deposits.filter((d) => d.status === 'PENDING');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'PENDING');
  const unreadAlerts = notifications.filter((n) => !n.read);

  const handleApproveWithdrawal = (id: string) => {
    approveWithdrawal(user.userId, id);
    setActionNotice(`Withdrawal ${id} approved. Funds permanently debited and marked as settled.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRejectWithdrawal = (id: string) => {
    rejectWithdrawal(user.userId, id, 'Rejected by compliance admin');
    setActionNotice(`Withdrawal ${id} rejected. Reserved funds restored to user available balance.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleApproveDeposit = (depositId: string) => {
    approveDeposit(user.userId, depositId);
    setActionNotice(`Deposit ${depositId} verified! Credited funds to user's wallet with ledger audit entry.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRejectDeposit = (depositId: string) => {
    rejectDeposit(user.userId, depositId, 'Unverified blockchain transaction hash');
    setActionNotice(`Deposit ${depositId} marked as rejected.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setQrCodeUrl(base64);
        setQrPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDepositConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!btcWalletAddress.trim()) {
      setActionNotice('Wallet address cannot be empty.');
      return;
    }
    setSavingConfig(true);
    await updateDepositSetting(
      user.userId,
      'BTC',
      btcWalletAddress.trim(),
      qrCodeUrl,
      depositInstructions
    );
    setSavingConfig(false);
    setActionNotice('Official Bitcoin deposit wallet address and QR code successfully updated in live system!');
    setTimeout(() => setActionNotice(null), 4500);
  };

  const handleToggleUser = (targetId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateUserStatus(user.userId, targetId, nextStatus);
    setActionNotice(`User ${targetId} status updated to ${nextStatus}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSendReply = (ticketId: string) => {
    if (!ticketReply.text.trim()) return;
    answerTicket(user.userId, ticketId, ticketReply.text);
    setTicketReply({ id: '', text: '' });
    setActionNotice(`Response sent to ticket ${ticketId}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-blue-600" /> Exchange Administration Terminal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono">
              {adminEmail}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervisory wallet configuration, incoming deposit approvals, withdrawal disbursements, and email notification dispatches.
          </p>
        </div>

        {actionNotice && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold shadow-xs">
            {actionNotice}
          </div>
        )}
      </div>

      {/* Immediate Alert Notification Banner when Requests are Pending */}
      {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-900">
                Action Required: {pendingDeposits.length} Pending Deposits &bull; {pendingWithdrawals.length} Pending Withdrawals
              </div>
              <div className="text-[11px] text-slate-600">
                Official alerts have been dispatched to admin email: <span className="font-mono font-bold text-blue-700">{adminEmail}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingDeposits.length > 0 && (
              <button
                onClick={() => setActiveTab('deposits')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Review Deposits ({pendingDeposits.length})
              </button>
            )}
            {pendingWithdrawals.length > 0 && (
              <button
                onClick={() => setActiveTab('withdrawals')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Review Withdrawals ({pendingWithdrawals.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Platform Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono-numbers">
            {stats.totalUsers}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">{stats.activeUsers} Active Traders</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Deposits</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mt-2 font-mono-numbers">
            {pendingDeposits.length}
          </div>
          <div className="text-xs text-blue-600 font-semibold mt-1">Awaiting Blockchain Credit</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Withdrawals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2 font-mono-numbers">
            {pendingWithdrawals.length}
          </div>
          <div className="text-xs text-amber-700 font-semibold mt-1">Awaiting Admin Approval</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Dispatched Alerts</span>
            <Mail className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-2 font-mono-numbers">
            {notifications.length}
          </div>
          <div className="text-xs text-indigo-600 font-semibold mt-1">Sent to {adminEmail.split('@')[0]}...</div>
        </div>
      </div>

      {/* 2. Admin Tab Navigation */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs overflow-x-auto">
        {[
          { id: 'deposits', label: `Deposit Config & Inflows (${pendingDeposits.length} Pending)`, icon: Wallet },
          { id: 'withdrawals', label: `Withdrawals (${pendingWithdrawals.length} Pending)`, icon: ArrowUpRight },
          { id: 'alerts', label: `Email Alerts (${notifications.length})`, icon: Mail },
          { id: 'users', label: `User Directory (${stats.totalUsers})`, icon: Users },
          { id: 'transactions', label: `Transactions (${transactions.length})`, icon: TrendingUp },
          { id: 'support', label: `Support Desk (${stats.openTickets} Open)`, icon: MessageSquare },
          { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* TAB: DEPOSITS & UPLOAD BTC WALLET ADDRESS */}
      {activeTab === 'deposits' && (
        <div className="space-y-6 text-xs">
          {/* Admin Wallet & QR Code Upload Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600" /> Admin Deposit Wallet &amp; QR Code Setup
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the official receiving Bitcoin (BTC) address and payment QR code that users see when depositing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Published to Depositors
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveDepositConfig} className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Official Receiving Bitcoin (BTC) Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={btcWalletAddress}
                      onChange={(e) => setBtcWalletAddress(e.target.value)}
                      placeholder="e.g. bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500 font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(btcWalletAddress, 'cfg-addr')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-blue-600"
                    >
                      {copiedId === 'cfg-addr' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Depositors copy this exact destination address when funding their NEXORA balance.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Deposit Instructions for Traders
                  </label>
                  <textarea
                    rows={3}
                    value={depositInstructions}
                    onChange={(e) => setDepositInstructions(e.target.value)}
                    placeholder="Provide specific network guidelines or minimum requirements..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Upload Payment QR Code Image
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Choose QR Code File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-slate-400 text-xs">Supports PNG, JPG, WebP</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  {savingConfig ? 'Publishing...' : 'Save & Publish Deposit Configuration'}
                </button>
              </div>

              {/* QR Code Live Preview */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 mb-3">Live Depositor QR Preview</span>
                <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-center overflow-hidden">
                  {qrPreview ? (
                    <img src={qrPreview} alt="QR Code Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center p-2 text-slate-400 text-[11px] flex flex-col items-center">
                      <QrCode className="w-10 h-10 text-slate-300 mb-1" />
                      Default QR code active
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-2 font-mono-numbers">Bitcoin Network Native</span>
              </div>
            </form>
          </div>

          {/* Incoming User Deposits Verification Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Incoming User Deposit Submissions</h2>
                <p className="text-xs text-slate-500">
                  Verify user blockchain transaction hashes and credit balances to wallets with double-entry ledger tracking.
                </p>
              </div>
              <div className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                Alerts Dispatched To: {adminEmail}
              </div>
            </div>

            <div className="overflow-x-auto">
              {deposits.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No deposit submissions received yet.</div>
              ) : (
                <table className="w-full text-left font-mono-numbers">
                  <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Deposit ID</th>
                      <th className="px-4 py-3.5">Trader Email</th>
                      <th className="px-4 py-3.5">Amount</th>
                      <th className="px-4 py-3.5">USD Value</th>
                      <th className="px-4 py-3.5">Transaction Hash (TXID)</th>
                      <th className="px-4 py-3.5">Receipt</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-900">{dep.id}</td>
                        <td className="px-4 py-3.5 text-slate-700 font-sans">
                          <div className="font-bold text-slate-900">{dep.userEmail}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{dep.userId}</div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-blue-700">
                          {dep.amount} {dep.asset}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          ${dep.usdAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 truncate max-w-xs font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{dep.txHash}</span>
                            <button
                              onClick={() => copyToClipboard(dep.txHash, `tx-${dep.id}`)}
                              className="text-slate-400 hover:text-blue-600 shrink-0"
                            >
                              {copiedId === `tx-${dep.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {dep.proofReceiptUrl ? (
                            <a
                              href={dep.proofReceiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 font-bold hover:underline text-xs flex items-center gap-1"
                            >
                              <span>Receipt</span> <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              dep.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : dep.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {dep.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {dep.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveDeposit(dep.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                              >
                                Credit Wallet
                              </button>
                              <button
                                onClick={() => handleRejectDeposit(dep.id)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: WITHDRAWALS APPROVAL & CLEARANCE */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-xs font-mono-numbers">
          <div className="px-6 py-4.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Review &amp; Approve Withdrawal Requests</h2>
              <p className="text-xs text-slate-500 font-sans">
                Approve pending client withdrawals to permanently disburse funds and execute double-entry ledger debit.
              </p>
            </div>
            <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 font-sans">
              Email Notifications Sent to: {adminEmail}
            </div>
          </div>

          <div className="overflow-x-auto">
            {withdrawals.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No withdrawal requests found.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Trader / User</th>
                    <th className="px-4 py-3.5">Method</th>
                    <th className="px-4 py-3.5">Requested Amount</th>
                    <th className="px-4 py-3.5">Destination Details</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Submitted</th>
                    <th className="px-6 py-3.5 text-right">Clearance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-900 font-sans">
                        <div>{w.userEmail || w.userId}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{w.userId}</div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700 font-sans">{w.withdrawalType}</td>
                      <td className="px-4 py-3.5 font-bold text-blue-700">
                        {w.amount} {w.asset} <span className="text-slate-400 text-[10px] font-normal">(Fee: {w.fee})</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-[11px] truncate max-w-xs font-mono">
                        {w.withdrawalType === 'CRYPTO'
                          ? w.destinationAddress
                          : `${w.bankDetails?.bankName} (Acct: ${w.bankDetails?.accountNumber})`}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : w.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {new Date(w.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-3.5 text-right font-sans">
                        {w.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveWithdrawal(w.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(w.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB: EMAIL ALERTS & DISPATCH LOG */}
      {activeTab === 'alerts' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" /> Administrative Email Dispatches ({adminEmail})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every deposit and withdrawal initiation generates an immediate administrative alert dispatched to <span className="font-bold text-slate-700">{adminEmail}</span>.
              </p>
            </div>

            <button
              onClick={() => markAllNotificationsAsRead()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Mark All Read
            </button>
          </div>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                No notification alerts have been dispatched yet. When a user deposits or withdraws, alerts will appear here.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    !notif.read
                      ? 'bg-blue-50/60 border-blue-200 shadow-xs'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          notif.type === 'DEPOSIT_INITIATED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {notif.type.replace('_', ' ')}
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm">{notif.title}</span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono-numbers">
                      Dispatched: {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <p className="text-slate-700 font-medium mb-3">{notif.message}</p>

                  {/* Email transcript preview */}
                  <div className="bg-slate-900 text-emerald-400 font-mono p-3.5 rounded-xl text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {notif.emailBody || notif.message}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <div className="text-slate-500 text-[11px]">
                      Target Recipient: <span className="font-bold text-slate-800">{notif.emailRecipient}</span> &bull; Status: <span className="text-emerald-600 font-bold">{notif.emailStatus}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${notif.emailRecipient}?subject=${encodeURIComponent(notif.title)}&body=${encodeURIComponent(notif.emailBody || notif.message)}`}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Launch Mail Client
                      </a>
                      <button
                        onClick={() => copyToClipboard(notif.emailBody || notif.message, notif.id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        {copiedId === notif.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Alert</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-xs">
          <div className="px-6 py-4.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold text-slate-900">Exchange Trader Accounts</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto font-mono-numbers">
            {users.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No users found.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Trader</th>
                    <th className="px-4 py-3.5">User ID</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Registered</th>
                    <th className="px-6 py-3.5 text-right">Compliance Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-sans">
                        <div className="font-bold text-slate-900">{u.fullName || 'Trader'}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px] font-mono">{u.userId}</td>
                      <td className="px-4 py-3.5 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-blue-100 text-blue-800 font-extrabold'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-sans">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3.5 text-right font-sans">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleUser(u.userId, u.status)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                              u.status === 'ACTIVE'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-xs font-mono-numbers">
          <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 font-sans">Exchange Transactions</h2>
            <span className="text-xs text-slate-500 font-sans">Real-time ledger entries</span>
          </div>

          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No transactions recorded yet.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">TX ID</th>
                    <th className="px-4 py-3.5">User</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Blockchain TX</th>
                    <th className="px-6 py-3.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{t.id}</td>
                      <td className="px-4 py-3.5 text-slate-700">{t.userId}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 font-sans">{t.type}</td>
                      <td className="px-4 py-3.5 font-bold text-blue-700">
                        {t.amount} {t.asset}
                      </td>
                      <td className="px-4 py-3.5 font-sans">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 truncate max-w-xs text-[11px]">
                        {t.blockchainTxHash || 'Internal Ledger'}
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-500 text-[11px]">
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB: SUPPORT DESK */}
      {activeTab === 'support' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-extrabold text-slate-900">Support Inquiries</h2>
          {tickets.length === 0 ? (
            <div className="py-12 text-center text-slate-400">No support tickets currently submitted.</div>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{t.userEmail} ({t.category})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-slate-700">{t.message}</p>
                  {t.adminResponse && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-blue-800 font-semibold">
                      Admin Response: {t.adminResponse}
                    </div>
                  )}
                  {t.status === 'OPEN' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type response..."
                        value={ticketReply.id === t.id ? ticketReply.text : ''}
                        onChange={(e) => setTicketReply({ id: t.id, text: e.target.value })}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleSendReply(t.id)}
                        className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs font-mono-numbers">
          <h2 className="text-sm font-extrabold text-slate-900 font-sans">Administrative Audit Trail</h2>
          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">No administrative actions logged yet.</div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span> by{' '}
                    <span className="text-blue-700 font-semibold">{log.adminEmail}</span> on {log.targetType} ({log.targetId})
                  </div>
                  <span className="text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
