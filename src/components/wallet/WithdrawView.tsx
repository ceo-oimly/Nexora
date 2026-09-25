import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserWallets, requestWithdrawal, getUserWithdrawals } from '../../services/ledgerService';
import { ArrowUpRight, Building2, Wallet as WalletIcon, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface WithdrawViewProps {
  onWithdrawComplete?: () => void;
}

export const WithdrawView: React.FC<WithdrawViewProps> = ({ onWithdrawComplete }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'crypto' | 'bank'>('crypto');

  // Crypto fields
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');

  // Bank fields
  const [bankHolder, setBankHolder] = useState(user?.fullName || '');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [usdAmount, setUsdAmount] = useState('500');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const wallets = user ? getUserWallets(user.userId) : [];
  const btcWallet = wallets.find((w) => w.asset === 'BTC');
  const usdWallet = wallets.find((w) => w.asset === 'USD');

  const cryptoFee = 0.00025;
  const parsedCryptoAmount = parseFloat(cryptoAmount) || 0;
  const cryptoNet = Math.max(0, parsedCryptoAmount - cryptoFee);

  const bankFee = 15.0;
  const parsedUsdAmount = parseFloat(usdAmount) || 0;
  const bankNet = Math.max(0, parsedUsdAmount - bankFee);

  const userWithdrawals = user ? getUserWithdrawals(user.userId) : [];

  const handleMaxCrypto = () => {
    if (!btcWallet) return;
    const maxVal = Math.max(0, btcWallet.availableBalance - cryptoFee);
    setCryptoAmount(maxVal.toFixed(6));
  };

  const handleMaxUsd = () => {
    if (!usdWallet) return;
    const maxVal = Math.max(0, usdWallet.availableBalance - bankFee);
    setUsdAmount(maxVal.toFixed(2));
  };

  const handleCryptoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!cryptoAddress.startsWith('bc1') && !cryptoAddress.startsWith('1') && !cryptoAddress.startsWith('3')) {
      setMessage({ text: 'Please enter a valid Bitcoin address (e.g. starting with bc1, 1, or 3).', isError: true });
      return;
    }

    if (parsedCryptoAmount <= cryptoFee) {
      setMessage({ text: `Withdrawal amount must be greater than network fee (${cryptoFee} BTC).`, isError: true });
      return;
    }

    setSubmitting(true);
    const result = requestWithdrawal({
      userId: user.userId,
      asset: 'BTC',
      amount: parsedCryptoAmount,
      withdrawalType: 'CRYPTO',
      destinationAddress: cryptoAddress,
    });

    setSubmitting(false);
    if (!result.success) {
      setMessage({ text: result.message || 'Withdrawal failed.', isError: true });
    } else {
      setMessage({
        text: `Withdrawal request for ${parsedCryptoAmount} BTC submitted successfully! Your funds are reserved in the vault pending compliance clearance.`,
      });
      setCryptoAmount('');
      setCryptoAddress('');
      onWithdrawComplete?.();
    }
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (parsedUsdAmount <= bankFee) {
      setMessage({ text: `Withdrawal amount must be greater than bank wire fee ($${bankFee}).`, isError: true });
      return;
    }

    setSubmitting(true);
    const result = requestWithdrawal({
      userId: user.userId,
      asset: 'USD',
      amount: parsedUsdAmount,
      withdrawalType: 'BANK',
      bankDetails: {
        accountHolder: bankHolder,
        bankName,
        accountNumber,
        routingNumber,
        swiftCode,
      },
    });

    setSubmitting(false);
    if (!result.success) {
      setMessage({ text: result.message || 'Withdrawal failed.', isError: true });
    } else {
      setMessage({
        text: `Bank wire withdrawal request for $${parsedUsdAmount.toLocaleString()} submitted successfully! Funds are held securely pending processing.`,
      });
      onWithdrawComplete?.();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <ArrowUpRight className="w-6 h-6 text-blue-600" /> Withdraw Funds
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Withdraw digital assets directly to an external wallet or request USD wire settlement to your bank account.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 border shadow-xs ${
            message.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {message.isError ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit text-xs">
        <button
          onClick={() => setActiveTab('crypto')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'crypto'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <WalletIcon className="w-4 h-4" /> Crypto Wallet (BTC)
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'bank'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" /> Bank Account (USD Wire)
        </button>
      </div>

      {activeTab === 'crypto' ? (
        /* CRYPTO WITHDRAWAL FORM */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <form
            onSubmit={handleCryptoSubmit}
            className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs"
          >
            {/* Available Balance Pill */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono-numbers">
              <span className="text-slate-600 font-medium">Available BTC Balance:</span>
              <span className="text-blue-700 font-bold text-sm">
                {btcWallet?.availableBalance.toFixed(6) ?? '0.000000'} BTC
              </span>
            </div>

            {/* Recipient Address */}
            <div>
              <label className="text-slate-700 font-bold block mb-1">Recipient Bitcoin Address</label>
              <input
                type="text"
                value={cryptoAddress}
                onChange={(e) => setCryptoAddress(e.target.value)}
                placeholder="e.g. bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block font-medium">Network: Bitcoin Mainnet (SegWit)</span>
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-700 font-bold">Withdrawal Amount</label>
                <button
                  type="button"
                  onClick={handleMaxCrypto}
                  className="text-blue-600 font-bold hover:underline"
                >
                  MAX
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                  placeholder="0.0000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500"
                  required
                />
                <span className="absolute right-4 top-2.5 text-slate-400 font-semibold">BTC</span>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono-numbers text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Network Mining Fee:</span>
                <span className="text-slate-900 font-medium">{cryptoFee} BTC</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2">
                <span>Net Disbursed:</span>
                <span className="text-blue-700 text-sm">{cryptoNet.toFixed(6)} BTC</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || parsedCryptoAmount <= 0}
              className={`w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wider uppercase shadow-md shadow-blue-600/20 transition-all ${
                submitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Reserving Balance...' : 'Confirm Crypto Withdrawal'}
            </button>
          </form>

          {/* Info Card */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Security Standards
            </h2>
            <ul className="space-y-2.5 text-slate-600 list-disc list-inside">
              <li>Address validation enforces standard Bitcoin formats.</li>
              <li>Requested funds are atomically locked via double-entry ledger to prevent double-spending.</li>
              <li>Withdrawals are processed securely from cold multi-signature storage.</li>
              <li>You can view status updates directly in your transaction history.</li>
            </ul>
          </div>
        </div>
      ) : (
        /* BANK WITHDRAWAL FORM */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <form
            onSubmit={handleBankSubmit}
            className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs"
          >
            {/* Available Balance Pill */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono-numbers">
              <span className="text-slate-600 font-medium">Available USD Balance:</span>
              <span className="text-blue-700 font-bold text-sm">
                ${usdWallet?.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 font-bold block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Chase, Bank of America"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Account Number / IBAN</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="8829104928"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 font-bold block mb-1">Routing Number</label>
                <input
                  type="text"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="021000021"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">SWIFT / BIC Code</label>
              <input
                type="text"
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value)}
                placeholder="CHASUS33"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-700 font-bold">USD Amount to Withdraw</label>
                <button
                  type="button"
                  onClick={handleMaxUsd}
                  className="text-blue-600 font-bold hover:underline"
                >
                  MAX
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="10"
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500"
                  required
                />
                <span className="absolute right-4 top-2.5 text-slate-400 font-semibold">USD</span>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono-numbers text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Wire Processing Fee:</span>
                <span className="text-slate-900 font-medium">${bankFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2">
                <span>Disbursed Amount:</span>
                <span className="text-blue-700 text-sm">
                  ${bankNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || parsedUsdAmount <= 0}
              className={`w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wider uppercase shadow-md shadow-blue-600/20 transition-all ${
                submitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Submitting Wire...' : 'Submit Bank Wire Request'}
            </button>
          </form>

          {/* Info Card */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
            <h2 className="font-bold text-slate-900">Wire Settlement Process</h2>
            <p className="text-slate-600 leading-relaxed">
              Bank wire withdrawals are handled via Fedwire and international SWIFT channels. Requests are verified and processed by the exchange treasury.
            </p>
          </div>
        </div>
      )}

      {/* User Withdrawal Requests Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Your Withdrawal History</h2>
        </div>
        <div className="overflow-x-auto">
          {userWithdrawals.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No withdrawal requests found.</div>
          ) : (
            <table className="w-full text-left text-xs font-mono-numbers">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-4 py-3">Asset &amp; Net Amount</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{w.withdrawalType}</td>
                    <td className="px-4 py-3.5 font-bold text-blue-700">
                      {w.netAmount} {w.asset}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {w.fee} {w.asset}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px] truncate max-w-xs">
                      {w.withdrawalType === 'CRYPTO' ? w.destinationAddress : `${w.bankDetails?.bankName} (Acct: ${w.bankDetails?.accountNumber})`}
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
                    <td className="px-6 py-3.5 text-slate-500 text-[11px]">
                      {new Date(w.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
