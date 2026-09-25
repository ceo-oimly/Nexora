import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPortfolioSummary, getUserWallets, getUserTransactions } from '../../services/ledgerService';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet as WalletIcon,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenTransactionDetails: (txId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenTransactionDetails }) => {
  const { user } = useAuth();
  const [chartTimeframe, setChartTimeframe] = useState<'7d' | '30d' | '90d'>('7d');

  if (!user) return null;

  const portfolio = getPortfolioSummary(user.userId);
  const wallets = getUserWallets(user.userId);
  const transactions = getUserTransactions(user.userId).slice(0, 6);

  const chartPoints = {
    '7d': [portfolio.totalValueUsd * 0.94, portfolio.totalValueUsd * 0.96, portfolio.totalValueUsd * 0.95, portfolio.totalValueUsd * 0.98, portfolio.totalValueUsd * 0.99, portfolio.totalValueUsd],
    '30d': [portfolio.totalValueUsd * 0.88, portfolio.totalValueUsd * 0.91, portfolio.totalValueUsd * 0.93, portfolio.totalValueUsd * 0.95, portfolio.totalValueUsd * 0.97, portfolio.totalValueUsd],
    '90d': [portfolio.totalValueUsd * 0.80, portfolio.totalValueUsd * 0.85, portfolio.totalValueUsd * 0.88, portfolio.totalValueUsd * 0.92, portfolio.totalValueUsd * 0.96, portfolio.totalValueUsd],
  }[chartTimeframe];

  const minChart = Math.min(...chartPoints) * 0.98;
  const maxChart = Math.max(...chartPoints) * 1.02;

  return (
    <div className="space-y-6">
      {/* 1. Portfolio Header Card & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Portfolio Metric Card in High-End Blue */}
        <div className="lg:col-span-2 bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-7 text-white shadow-lg shadow-blue-500/15 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-semibold text-blue-100 tracking-wider uppercase">
                Total Portfolio Valuation
              </span>
              <div className="flex items-baseline gap-3 mt-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono-numbers">
                  ${portfolio.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-white/15 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  <TrendingUp className="w-3.5 h-3.5" /> +{portfolio.change24h}% (24h)
                </span>
              </div>
            </div>

            {/* Quick Actions Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onNavigate('deposit')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <ArrowDownLeft className="w-4 h-4 text-blue-700" /> Deposit
              </button>
              <button
                onClick={() => onNavigate('withdraw')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-800/60 hover:bg-blue-800/80 text-white border border-blue-400/30 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </button>
              <button
                onClick={() => onNavigate('trade')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-900/60 hover:bg-indigo-900/80 text-white border border-indigo-400/30 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <TrendingUp className="w-4 h-4" /> Trade BTC
              </button>
            </div>
          </div>

          {/* Asset Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/15 text-xs font-mono-numbers">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <div className="text-blue-100 text-[11px] font-medium">BTC Holdings</div>
              <div className="text-white font-bold text-base mt-0.5">{portfolio.btcBalance.toFixed(4)} BTC</div>
              <div className="text-[10px] text-blue-200">
                ≈ ${(portfolio.btcBalance * portfolio.currentBtcPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <div className="text-blue-100 text-[11px] font-medium">USD Cash Available</div>
              <div className="text-white font-bold text-base mt-0.5">
                ${portfolio.usdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-blue-200">Ready for Trading</div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 col-span-2 sm:col-span-1">
              <div className="text-blue-100 text-[11px] font-medium">Live Bitcoin Price</div>
              <div className="text-white font-bold text-base mt-0.5">
                ${portfolio.currentBtcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-300">Live Exchange Index</div>
            </div>
          </div>
        </div>

        {/* 2. Portfolio Performance Chart Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Asset Trajectory
            </span>
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[10px] font-bold">
              {(['7d', '30d', '90d'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-md transition-all uppercase ${
                    chartTimeframe === tf ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Trendline in Blue */}
          <div className="h-32 w-full my-3 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,100 ${chartPoints
                  .map((p, idx) => {
                    const x = (idx / (chartPoints.length - 1)) * 300;
                    const y = 100 - ((p - minChart) / (maxChart - minChart)) * 80 - 10;
                    return `${x},${y}`;
                  })
                  .join(' ')} 300,100`}
                fill="url(#blueGrad)"
              />
              <polyline
                points={chartPoints
                  .map((p, idx) => {
                    const x = (idx / (chartPoints.length - 1)) * 300;
                    const y = 100 - ((p - minChart) / (maxChart - minChart)) * 80 - 10;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 font-mono-numbers">
            <span>Low: ${minChart.toFixed(0)}</span>
            <span className="text-blue-600 font-bold">High: ${maxChart.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* 3. Wallets Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-blue-600" /> Exchange Wallets
          </h2>
          <span className="text-xs text-slate-500 font-medium">Double-entry verified</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-blue-300 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-xl ${
                    wallet.asset === 'BTC' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {wallet.symbol}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{wallet.name}</h3>
                    <span className="text-xs text-slate-500 font-medium">{wallet.asset} Spot Vault</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold text-slate-900 font-mono-numbers">
                    ${wallet.usdEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <div className="text-[11px] text-slate-500">Valuation</div>
                </div>
              </div>

              {/* Balances Breakdown */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs font-mono-numbers">
                <div>
                  <span className="text-[11px] text-slate-500">Available:</span>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">
                    {wallet.asset === 'BTC' ? wallet.availableBalance.toFixed(4) : `$${wallet.availableBalance.toLocaleString()}`}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">In Orders / Locked:</span>
                  <div className="font-bold text-blue-700 mt-0.5 truncate">
                    {wallet.asset === 'BTC' ? wallet.lockedBalance.toFixed(4) : `$${wallet.lockedBalance.toLocaleString()}`}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Total Balance:</span>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">
                    {wallet.asset === 'BTC' ? wallet.totalBalance.toFixed(4) : `$${wallet.totalBalance.toLocaleString()}`}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('deposit')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Deposit
                </button>
                <button
                  onClick={() => onNavigate('withdraw')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Withdraw
                </button>
                <button
                  onClick={() => onNavigate('trade')}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Trade Spot
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recent Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" /> Recent Transactions
          </h2>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold"
          >
            All Activity <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No recent ledger activity.</div>
          ) : (
            <table className="w-full text-left text-xs font-mono-numbers">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Asset &amp; Amount</th>
                  <th className="px-4 py-3.5">USD Value</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {tx.type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-4 font-bold text-blue-700">
                      {tx.amount} {tx.asset}
                    </td>
                    <td className="px-4 py-4 text-slate-800 font-semibold">
                      ${tx.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onOpenTransactionDetails(tx.id)}
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
      </div>
    </div>
  );
};
