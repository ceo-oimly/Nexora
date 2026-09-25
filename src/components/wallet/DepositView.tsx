import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCurrentPrice } from '../../services/marketService';
import {
  getDepositSetting,
  submitUserDeposit,
  getAllDeposits,
} from '../../services/ledgerService';
import { DepositSetting, DepositRequest } from '../../types/exchange';
import {
  QrCode,
  Copy,
  Check,
  ArrowDownLeft,
  CheckCircle2,
  Upload,
  Clock,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface DepositViewProps {
  onDepositComplete?: () => void;
}

export const DepositView: React.FC<DepositViewProps> = ({ onDepositComplete }) => {
  const { user } = useAuth();
  const [depositSetting, setDepositSetting] = useState<DepositSetting>(getDepositSetting('BTC'));
  const [usdAmount, setUsdAmount] = useState<string>('500');
  const [txHash, setTxHash] = useState<string>('');
  const [proofPreview, setProofPreview] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);

  const currentPrice = getCurrentPrice();
  const parsedUsd = parseFloat(usdAmount) || 0;
  const btcAmount = parsedUsd > 0 ? Number((parsedUsd / currentPrice).toFixed(6)) : 0;

  useEffect(() => {
    setDepositSetting(getDepositSetting('BTC'));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(depositSetting.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleQuickAdd = (add: number) => {
    const cur = parseFloat(usdAmount) || 0;
    setUsdAmount((cur + add).toString());
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (btcAmount <= 0) return;
    if (!txHash.trim()) {
      setDepositSuccess('Please enter your transaction hash (TXID) from your wallet.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      submitUserDeposit({
        userId: user.userId,
        userEmail: user.email,
        asset: 'BTC',
        amount: btcAmount,
        usdAmount: parsedUsd,
        depositAddress: depositSetting.walletAddress,
        txHash: txHash.trim(),
        proofReceiptUrl: proofPreview || undefined,
      });

      setSubmitting(false);
      setDepositSuccess(
        `Deposit notification for ${btcAmount} BTC ($${parsedUsd.toLocaleString()}) submitted! Your transaction is awaiting administrative blockchain verification.`
      );
      setTxHash('');
      setProofPreview('');
      onDepositComplete?.();
    }, 700);
  };

  // User's deposits
  const userDeposits = user
    ? getAllDeposits().filter((d) => d.userId === user.userId)
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <ArrowDownLeft className="w-6 h-6 text-blue-600" /> Deposit Bitcoin (BTC)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Send Bitcoin to the official exchange address below and submit your transaction hash to credit your account.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Institutional Custody Protected</span>
        </div>
      </div>

      {depositSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{depositSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Official Wallet Address & QR Code */}
        <div className="md:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Official Deposit Address
              </label>
              <span className="text-[11px] text-blue-600 font-semibold">{depositSetting.network}</span>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-mono-numbers text-xs text-slate-900 font-semibold truncate flex-1 select-all">
                {depositSetting.walletAddress}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Admin Uploaded QR Code Display */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center relative overflow-hidden">
              {depositSetting.qrCodeUrl ? (
                <img
                  src={depositSetting.qrCodeUrl}
                  alt="Deposit QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                /* High-fidelity SVG QR Code */
                <div className="w-full h-full border-4 border-slate-900 p-2 flex flex-col justify-between rounded-lg">
                  <div className="flex justify-between">
                    <div className="w-9 h-9 bg-slate-900 border-2 border-white rounded-xs" />
                    <div className="w-9 h-9 bg-slate-900 border-2 border-white rounded-xs" />
                  </div>
                  <div className="flex justify-center items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center font-mono-numbers text-sm shadow-md">
                      ₿
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-9 h-9 bg-slate-900 border-2 border-white rounded-xs" />
                    <div className="w-7 h-7 bg-slate-800 rounded-xs" />
                  </div>
                </div>
              )}
            </div>

            <span className="text-xs text-slate-600 mt-3 font-semibold text-center font-mono-numbers">
              Scan with your Bitcoin Wallet
            </span>
          </div>

          {/* Instructions from Admin */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1.5 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <Info className="w-4 h-4 text-blue-600" /> Deposit Instructions
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              {depositSetting.instructions ||
                'Send only Bitcoin (BTC) via the Bitcoin Mainnet. Funds will be credited to your spot wallet upon administrative verification of your submitted transaction.'}
            </p>
          </div>
        </div>

        {/* Right Column: User Proof Submission & Verification Form */}
        <div className="md:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5">
          <form onSubmit={handleSubmitDeposit} className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Submit Payment Proof</h2>
              <p className="text-xs text-slate-500">
                After sending from your private wallet, enter the payment details below for immediate processing.
              </p>
            </div>

            {/* USD Input */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                <label>Deposit Amount (USD Equivalent)</label>
                <span className="font-mono-numbers font-semibold">1 BTC = ${currentPrice.toLocaleString()}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="50"
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono-numbers text-sm focus:outline-none focus:border-blue-500"
                  placeholder="500"
                  required
                />
                <span className="absolute right-4 top-2.5 text-slate-400 text-xs font-semibold">USD</span>
              </div>
            </div>

            {/* Quick addition buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[250, 500, 1000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-mono-numbers text-slate-700 hover:text-blue-700 font-semibold transition-colors"
                >
                  +${val.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Computed BTC */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center font-mono-numbers text-xs">
              <span className="text-slate-600 font-medium">Bitcoin (BTC) Amount Sent:</span>
              <span className="text-blue-700 font-extrabold text-base">{btcAmount} BTC</span>
            </div>

            {/* Transaction Hash Input */}
            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1">
                Blockchain Transaction Hash (TXID)
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="e.g. 7f8a9b2c3d4e5f60718293a4b5c6d7e8f9012345..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Copy and paste the transaction hash or ID provided by your sending wallet.
              </span>
            </div>

            {/* Optional Screenshot Receipt Upload */}
            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1">
                Attach Payment Receipt (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Upload Screenshot</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofUpload}
                    className="hidden"
                  />
                </label>
                {proofPreview && (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Receipt Attached
                  </span>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={submitting || btcAmount <= 0}
              className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all ${
                submitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Submitting Verification...' : `Submit Payment Notification (${btcAmount} BTC)`}
            </button>
          </form>
        </div>
      </div>

      {/* User Deposit Submission History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Your Submitted Deposits</h2>
          <span className="text-xs text-slate-500 font-medium">Updated in Real-Time</span>
        </div>

        <div className="overflow-x-auto">
          {userDeposits.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No deposit submissions recorded yet. Send Bitcoin using the address above to fund your account.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono-numbers">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Deposit ID</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">USD Valuation</th>
                  <th className="px-4 py-3">Transaction Hash</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userDeposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{dep.id}</td>
                    <td className="px-4 py-3.5 font-bold text-blue-700">
                      {dep.amount} {dep.asset}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      ${dep.usdAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 truncate max-w-xs">{dep.txHash}</td>
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
                        {dep.status === 'COMPLETED'
                          ? 'CONFIRMED'
                          : dep.status === 'REJECTED'
                          ? 'REJECTED'
                          : 'PENDING VERIFICATION'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-500 text-[11px]">
                      {new Date(dep.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
