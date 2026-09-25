import React, { useState } from 'react';
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
import { DepositSetting, DepositRequest } from '../../types/exchange';
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
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'users' | 'transactions' | 'support' | 'audit'>('deposits');
  const [userSearch, setUserSearch] = useState('');
  const [ticketReply, setTicketReply] = useState<{ id: string; text: string }>({ id: '', text: '' });
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Deposit Config State
  const initialSetting = getDepositSetting('BTC');
  const [btcWalletAddress, setBtcWalletAddress] = useState(initialSetting.walletAddress);
  const [depositInstructions, setDepositInstructions] = useState(initialSetting.instructions || '');
  const [qrCodeUrl, setQrCodeUrl] = useState(initialSetting.qrCodeUrl || '');
  const [qrPreview, setQrPreview] = useState(initialSetting.qrCodeUrl || '');
  const [savingConfig, setSavingConfig] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-blue-600" /> Exchange Administration Terminal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisory wallet configuration, incoming deposit approvals, withdrawal disbursements, and audit logs.
          </p>
        </div>

        {actionNotice && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold shadow-xs">
            {actionNotice}
          </div>
        )}
      </div>

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
            <span>Trading Volume</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono-numbers">
            ${stats.tradingVolumeUsd.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Spot Ledger Fills</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Deposits</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700 mt-2 font-mono-numbers">
            {stats.pendingDeposits || deposits.filter(d => d.status === 'PENDING').length}
          </div>
          <div className="text-xs text-blue-600 font-semibold mt-1">Awaiting Credit</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Withdrawals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2 font-mono-numbers">
            {stats.pendingWithdrawals}
          </div>
          <div className="text-xs text-amber-700 font-semibold mt-1">Awaiting Clearance</div>
        </div>
      </div>

      {/* 2. Admin Tab Navigation */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs overflow-x-auto">
        {[
          { id: 'deposits', label: `Deposit Config & Inflows (${deposits.filter(d => d.status === 'PENDING').length} Pending)`, icon: Wallet },
          { id: 'withdrawals', label: `Withdrawals (${stats.pendingWithdrawals})`, icon: ArrowUpRight },
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
      {/* DEPOSIT CONFIGURATION & INCOMING DEPOSIT REVIEWS */}
      {activeTab === 'deposits' && (
        <div className="space-y-6 text-xs">
          {/* Admin Wallet & QR Code Upload Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600" /> Admin Deposit Wallet &amp; QR Code Setup
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the official receiving Bitcoin wallet address and upload the payment QR code displayed to depositors.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDepositConfig} className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Official Receiving Bitcoin (BTC) Address
                  </label>
                  <input
                    type="text"
                    value={btcWalletAddress}
                    onChange={(e) => setBtcWalletAddress(e.target.value)}
                    placeholder="e.g. bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500 font-semibold"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    This is the destination address that all users will copy when making Bitcoin payments.
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
                  {savingConfig ? 'Saving Settings...' : 'Save & Publish Deposit Configuration'}
                </button>
              </div>

              {/* QR Code Live Preview */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 mb-3">Live QR Code Preview</span>
                <div className="w-40 h-40 bg-white p-2.5 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center overflow-hidden">
                  {qrPreview ? (
                    <img src={qrPreview} alt="QR Code Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center p-2 text-slate-400 text-[11px]">
                      No custom QR image uploaded. Default SVG will display.
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-2 font-mono-numbers">Bitcoin Network</span>
              </div>
            </form>
          </div>

          {/* Incoming User Deposits Verification Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Incoming User Deposit Submissions</h2>
                <p className="text-xs text-slate-500">Verify user payment hashes and credit balances to wallets.</p>
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
                      <th className="px-4 py-3.5">User</th>
                      <th className="px-4 py-3.5">Amount</th>
                      <th className="px-4 py-3.5">USD Value</th>
                      <th className="px-4 py-3.5">Transaction Hash (TXID)</th>
                      <th className="px-4 py-3.5">Receipt</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-900">{dep.id}</td>
                        <td className="px-4 py-3.5 text-slate-700">
                          <div className="font-bold text-slate-900">{dep.userEmail}</div>
                          <div className="text-[10px] text-slate-400">{dep.userId}</div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-blue-700">
                          {dep.amount} {dep.asset}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          ${dep.usdAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 truncate max-w-xs">{dep.txHash}</td>
                        <td className="px-4 py-3.5">
                          {dep.proofReceiptUrl ? (
                            <a
                              href={dep.proofReceiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 font-bold hover:underline text-xs"
                            >
                              View Receipt
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
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                              >
                                Credit Wallet
                              </button>
                              <button
                                onClick={() => handleRejectDeposit(dep.id)}
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
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

      {/* WITHDRAWALS APPROVAL/REJECTION */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-xs font-mono-numbers">
          <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Review Withdrawal Requests</h2>
            <span className="text-xs text-slate-500">Atomic ledger updates on disbursement</span>
          </div>

          <div className="overflow-x-auto">
            {withdrawals.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No withdrawal requests found.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-4 py-3.5">Method</th>
                    <th className="px-4 py-3.5">Asset &amp; Amount</th>
                    <th className="px-4 py-3.5">Destination Details</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Submitted</th>
                    <th className="px-6 py-3.5 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-900">{w.userId}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{w.withdrawalType}</td>
                      <td className="px-4 py-3.5 font-bold text-blue-700">
                        {w.amount} {w.asset} (Fee: {w.fee})
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px] truncate max-w-xs">
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
                      <td className="px-6 py-3.5 text-right">
                        {w.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveWithdrawal(w.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(w.id)}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
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

      {/* USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-xs">
          <div className="px-6 py-4.5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-sm font-extrabold text-slate-900">User Directory &amp; RBAC Permissions</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-numbers">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Email Verified</th>
                  <th className="px-6 py-3.5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 overflow-hidden border border-blue-200">
                        {u.avatarUrl && <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span>{u.fullName}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {u.emailVerified ? 'Yes (Verified)' : 'No'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleUser(u.userId, u.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
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
          </div>
        </div>
      )}

      {/* SUPPORT TICKETS */}
      {activeTab === 'support' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-xs space-y-4 p-6">
          <h2 className="text-sm font-extrabold text-slate-900">Customer Support Ticket Inquiries</h2>

          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="py-8 text-center text-slate-400">No support tickets.</div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 font-mono-numbers">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{t.id}</span>
                      <span className="ml-2 text-slate-600 font-normal">({t.userEmail})</span>
                      <span className="ml-2 text-blue-700 font-semibold">[{t.category}]</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-slate-800 font-sans text-xs">{t.message}</p>

                  {t.adminResponse ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-slate-800 text-xs font-sans">
                      <strong className="text-emerald-700 block text-[10px] uppercase font-bold mb-1">Exchange Response:</strong>
                      {t.adminResponse}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ticketReply.id === t.id ? ticketReply.text : ''}
                        onChange={(e) => setTicketReply({ id: t.id, text: e.target.value })}
                        placeholder="Write official exchange resolution response..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                      />
                      <button
                        onClick={() => handleSendReply(t.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs"
                      >
                        Reply &amp; Resolve
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-xs font-mono-numbers">
          <div className="px-6 py-4.5 border-b border-slate-200">
            <h2 className="text-sm font-extrabold text-slate-900">Immutable Administrative Audit Trail</h2>
          </div>
          <div className="overflow-x-auto">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No audit log records recorded yet.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-4 py-3.5">Admin</th>
                    <th className="px-4 py-3.5">Action Executed</th>
                    <th className="px-4 py-3.5">Target Type</th>
                    <th className="px-4 py-3.5">Target Identifier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 text-slate-500 text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-slate-800 font-semibold">{log.adminEmail}</td>
                      <td className="px-4 py-3.5 text-blue-700 font-bold">{log.action}</td>
                      <td className="px-4 py-3.5 text-slate-600">{log.targetType}</td>
                      <td className="px-4 py-3.5 text-slate-800">{log.targetId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm text-xs font-mono-numbers">
          <div className="px-6 py-4.5 border-b border-slate-200">
            <h2 className="text-sm font-extrabold text-slate-900">All Exchange Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Tx ID</th>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">USD Value</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 text-slate-800 font-medium truncate max-w-xs">{tx.id}</td>
                    <td className="px-4 py-3.5 text-slate-900 font-bold">{tx.userId}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{tx.type}</td>
                    <td className="px-4 py-3.5 text-blue-700 font-bold">{tx.amount} {tx.asset}</td>
                    <td className="px-4 py-3.5 text-slate-900">${tx.usdValue.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-500 text-[11px]">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
