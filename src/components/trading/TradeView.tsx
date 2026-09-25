import React, { useState, useEffect } from 'react';
import { TradingChart } from './TradingChart';
import { OrderBook } from './OrderBook';
import { OrderEntry } from './OrderEntry';
import { OpenOrdersTable } from './OpenOrdersTable';
import { getTicker } from '../../services/marketService';
import { TickerData } from '../../types/exchange';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const TradeView: React.FC = () => {
  const [ticker, setTicker] = useState<TickerData>(getTicker());
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(getTicker());
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleOrderPlaced = () => {
    setRefreshCounter((c) => c + 1);
  };

  const isPositive = ticker.change24h >= 0;

  return (
    <div className="space-y-4">
      {/* 1. Terminal Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Pair & Current Price */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-extrabold text-blue-700 text-lg font-mono-numbers shadow-xs">
              ₿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-slate-900 font-mono-numbers">BTC/USD</h1>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded font-bold">
                  SPOT
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Bitcoin / US Dollar</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Large Price with 24h Change */}
          <div className="font-mono-numbers">
            <div className={`text-2xl font-extrabold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${ticker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={`flex items-center ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
                {isPositive ? '+' : ''}{ticker.change24h}%
              </span>
              <span className="text-slate-400 font-normal">Index: ${ticker.indexPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 24h Stats Ribbon */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-7 text-xs font-mono-numbers text-slate-600">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">24h High</div>
            <div className="text-slate-900 font-bold">${ticker.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">24h Low</div>
            <div className="text-slate-900 font-bold">${ticker.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">24h Volume (BTC)</div>
            <div className="text-slate-900 font-bold">{ticker.volume24h.toLocaleString()} BTC</div>
          </div>
          <div className="hidden lg:block">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Spread</div>
            <div className="text-slate-900 font-bold">${ticker.spread.toFixed(2)}</div>
          </div>
          <div className="hidden xl:block">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Order Book Depth</div>
            <div className="text-blue-700 font-bold">${(ticker.liquidity / 1000000).toFixed(1)}M</div>
          </div>
        </div>
      </div>

      {/* 2. Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Candlestick Chart (8 cols on Desktop) */}
        <div className="lg:col-span-8 flex flex-col h-[520px]">
          <TradingChart pair="BTC/USD" />
        </div>

        {/* Right Column: Order Book (4 cols on Desktop) */}
        <div className="lg:col-span-4 flex flex-col h-[520px]">
          <OrderBook />
        </div>
      </div>

      {/* 3. Bottom Grid: Order Entry & Orders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Order Entry (4 cols on Desktop) */}
        <div className="lg:col-span-4">
          <OrderEntry onOrderPlaced={handleOrderPlaced} />
        </div>

        {/* Open Orders & Execution History (8 cols on Desktop) */}
        <div className="lg:col-span-8">
          <OpenOrdersTable refreshTrigger={refreshCounter} onOrderUpdated={handleOrderPlaced} />
        </div>
      </div>
    </div>
  );
};
