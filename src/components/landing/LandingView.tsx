import React from 'react';
import { getCurrentPrice, getTicker } from '../../services/marketService';
import {
  TrendingUp,
  Shield,
  Zap,
  Lock,
  ArrowRight,
  Database,
  BarChart3,
  CheckCircle,
  Cpu,
} from 'lucide-react';

interface LandingViewProps {
  onGetStarted: () => void;
  onExploreDemo: () => void;
  onLogin: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onGetStarted, onExploreDemo, onLogin }) => {
  const currentBtcPrice = getCurrentPrice();
  const ticker = getTicker();

  return (
    <div className="space-y-16 py-6">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 space-y-6 relative z-10">
          {/* Live Market Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-blue-200 text-xs font-mono-numbers text-slate-800 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-bold text-slate-900">BTC/USD:</span>
            <span className="text-blue-700 font-extrabold">${currentBtcPrice.toLocaleString()}</span>
            <span className="text-emerald-600 font-bold">+{ticker.change24h}% (24h)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Institutional Cryptocurrency Trading &amp;{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
              Audited Ledger
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Execute Bitcoin spot trades with high-frequency order matching, deep liquidity, segregated multi-asset wallets, and verifiable double-entry ledger settlement.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onExploreDemo}
              className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              Enter Trading Terminal <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onGetStarted}
              className="px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm shadow-xs transition-all hover:scale-105 active:scale-95"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* 2. Live Market Assets Table */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" /> Supported Exchange Markets
            </h2>
            <span className="text-xs text-slate-500 font-mono-numbers font-medium">Live Order Depth</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-numbers">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Asset / Pair</th>
                  <th className="px-4 py-3.5">Last Price</th>
                  <th className="px-4 py-3.5">24h Change</th>
                  <th className="px-4 py-3.5">24h High</th>
                  <th className="px-4 py-3.5">24h Low</th>
                  <th className="px-4 py-3.5">24h Volume</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-extrabold text-blue-700 text-sm">
                      ₿
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm font-sans">Bitcoin</div>
                      <div className="text-[11px] text-slate-500">BTC/USD (Spot)</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-900 text-sm">
                    ${ticker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 font-bold text-emerald-600">
                    +{ticker.change24h}%
                  </td>
                  <td className="px-4 py-4 text-slate-700">${ticker.high24h.toLocaleString()}</td>
                  <td className="px-4 py-4 text-slate-700">${ticker.low24h.toLocaleString()}</td>
                  <td className="px-4 py-4 text-slate-700">{ticker.volume24h.toLocaleString()} BTC</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={onExploreDemo}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Trade Now
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-extrabold text-emerald-700 text-sm">
                      $
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm font-sans">US Dollar</div>
                      <div className="text-[11px] text-slate-500">USD (Fiat Clearing)</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-900 text-sm">$1.00</td>
                  <td className="px-4 py-4 text-slate-500">0.00%</td>
                  <td className="px-4 py-4 text-slate-500">$1.00</td>
                  <td className="px-4 py-4 text-slate-500">$1.00</td>
                  <td className="px-4 py-4 text-slate-700">$120,490,000</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={onExploreDemo}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                    >
                      Deposit Cash
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. Core Architectural Pillars */}
      <section className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">Double-Entry Ledger</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every trade execution, deposit credit, and withdrawal lock is calculated strictly on the backend with atomic balance guarantees and verifiable audit logs.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">High-Throughput Order Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Full support for Market, Limit, and Stop-Limit orders with realistic slippage modeling, spread calculations, and deterministic fills.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">Cold Storage &amp; Admin Approval</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Admin configured deposit addresses, QR code uploads, confirmation requirements, and strict administrative clearance before funds disburse.
          </p>
        </div>
      </section>
    </div>
  );
};
