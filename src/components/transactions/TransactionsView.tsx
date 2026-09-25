import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserTransactions } from '../../services/ledgerService';
import { Transaction } from '../../types/exchange';
import {
  History,
  Search,
  CheckCircle2,
  Copy,
  Check,
  X,
  FileText,
} from 'lucide-react';

interface TransactionsViewProps {
  initialTxId?: string | null;
  onCloseInitialTx?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ initialTxId, onCloseInitialTx }) => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const allTx = user ? getUserTransactions(user.userId) : [];

  React.useEffect(() => {
    if (initialTxId && allTx.length > 0) {
      const match = allTx.find((t) => t.id === initialTxId);
      if (match) setSelectedTx(match);
    }
  }, [initialTxId, allTx]);

  const filtered = allTx.filter((tx) => {
    if (filterType === 'DEPOSITS' && tx.type !== 'DEPOSIT') return false;
    if (filterType === 'WITHDRAWALS' && tx.type !== 'WITHDRAWAL') return false;
    if (filterType === 'TRADES' && !tx.type.startsWith('TRADE')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = tx.id.toLowerCase().includes(q);
      const matchType = tx.type.toLowerCase().includes(q);
      const matchAsset = tx.asset.toLowerCase().includes(q);
      const matchDate = new Date(tx.createdAt).toLocaleDateString().toLowerCase().includes(q);
      const matchHash = tx.blockchainTxHash?.toLowerCase().includes(q);
      if (!matchId && !matchType && !matchAsset && !matchDate && !matchHash) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const pagedTx = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <History className="w-6 h-6 text-blue-600" /> Transaction History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete cryptographic audit trail of all deposits, withdrawals, and spot order fills.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
          {['ALL', 'DEPOSITS', 'WITHDRAWALS', 'TRADES'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setFilterType(tab);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                filterType === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by Transaction ID, Asset, Hash, or Date..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-mono-numbers shadow-xs"
        />
      </div>

      {/* Transactions Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {pagedTx.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No transactions match your search or filter criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono-numbers">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Transaction ID</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Asset</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">USD Value</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date &amp; Time</th>
                  <th className="px-6 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-bold truncate max-w-[140px]">
                      {tx.id}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-slate-900">
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700 font-medium">{tx.asset}</td>
                    <td className="px-4 py-4 font-bold text-blue-700">
                      {tx.amount} {tx.asset}
                    </td>
                    <td className="px-4 py-4 text-slate-900 font-semibold">
                      ${tx.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-semibold transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs font-mono-numbers">
            <span className="text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold"
              >
                Previous
              </button>
              <span className="px-2 text-slate-600 font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Transaction Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-7 shadow-2xl relative text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Transaction Receipt</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedTx(null);
                  onCloseInitialTx?.();
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono-numbers">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Transaction ID:</span>
                <span className="font-bold text-slate-900 select-all">{selectedTx.id}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Operation:</span>
                <span className="font-bold text-blue-700">{selectedTx.type}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Amount:</span>
                <span className="font-bold text-slate-900">
                  {selectedTx.amount} {selectedTx.asset}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">USD Value:</span>
                <span className="text-slate-900 font-semibold">${selectedTx.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedTx.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {selectedTx.status} ({selectedTx.confirmations}/{selectedTx.requiredConfirmations} Confirmations)
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Timestamp:</span>
                <span className="text-slate-700">{new Date(selectedTx.createdAt).toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Source:</span>
                <span className="text-slate-700 truncate max-w-xs">{selectedTx.source}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Destination:</span>
                <span className="text-slate-700 truncate max-w-xs">{selectedTx.destination}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Fee:</span>
                <span className="text-slate-900 font-semibold">${selectedTx.networkFee.toFixed(4)}</span>
              </div>

              {selectedTx.blockchainTxHash && (
                <div className="pt-2">
                  <span className="text-slate-500 font-medium block mb-1">Blockchain Hash / Reference:</span>
                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-800 truncate select-all flex-1 font-mono-numbers">
                      {selectedTx.blockchainTxHash}
                    </span>
                    <button
                      onClick={() => handleCopyHash(selectedTx.blockchainTxHash!)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1 text-[11px] font-semibold"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedHash ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => {
                  setSelectedTx(null);
                  onCloseInitialTx?.();
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
