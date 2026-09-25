import React, { useState, useEffect } from 'react';
import { OrderBookLevel, RecentTrade } from '../../types/exchange';
import { generateOrderBook, generateInitialRecentTrades, getCurrentPrice } from '../../services/marketService';

export const OrderBook: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');
  const [orderBook, setOrderBook] = useState<{ asks: OrderBookLevel[]; bids: OrderBookLevel[] }>({
    asks: [],
    bids: [],
  });
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [lastPrice, setLastPrice] = useState<number>(getCurrentPrice());
  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up');

  useEffect(() => {
    setOrderBook(generateOrderBook());
    setRecentTrades(generateInitialRecentTrades());

    const interval = setInterval(() => {
      const newPrice = getCurrentPrice();
      setPriceDirection(newPrice >= lastPrice ? 'up' : 'down');
      setLastPrice(newPrice);
      setOrderBook(generateOrderBook(newPrice));

      if (Math.random() > 0.3) {
        const side = Math.random() > 0.48 ? 'BUY' : 'SELL';
        const tradeAmount = Number((0.01 + Math.random() * 0.95).toFixed(4));
        const trade: RecentTrade = {
          id: `t_${Date.now()}`,
          price: newPrice,
          amount: tradeAmount,
          side,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setRecentTrades((prev) => [trade, ...prev.slice(0, 24)]);
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [lastPrice]);

  const maxAskTotal = orderBook.asks.length > 0 ? Math.max(...orderBook.asks.map((a) => a.total)) : 1;
  const maxBidTotal = orderBook.bids.length > 0 ? Math.max(...orderBook.bids.map((b) => b.total)) : 1;
  const maxTotal = Math.max(maxAskTotal, maxBidTotal) || 1;

  const bestAsk = orderBook.asks.length > 0 ? orderBook.asks[orderBook.asks.length - 1].price : lastPrice + 1;
  const bestBid = orderBook.bids.length > 0 ? orderBook.bids[0].price : lastPrice - 1;
  const spread = Math.abs(bestAsk - bestBid);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-xs">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeTab === 'book'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Order Book
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeTab === 'trades'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recent Trades
          </button>
        </div>

        <span className="text-[10px] text-slate-500 font-mono-numbers font-medium">BTC/USD Depth</span>
      </div>

      {activeTab === 'book' ? (
        <div className="flex flex-col flex-1 p-2.5 overflow-hidden">
          {/* Column Header */}
          <div className="grid grid-cols-3 px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono-numbers border-b border-slate-100">
            <div>Price (USD)</div>
            <div className="text-right">Size (BTC)</div>
            <div className="text-right">Total</div>
          </div>

          {/* ASKS (Sell Orders - Red) */}
          <div className="flex flex-col-reverse justify-end overflow-hidden flex-1 space-y-0.5 py-1">
            {orderBook.asks.slice(-7).map((ask, idx) => {
              const depthPct = Math.min(100, (ask.total / maxTotal) * 100);
              return (
                <div
                  key={`ask_${idx}`}
                  className="relative grid grid-cols-3 px-2 py-0.5 font-mono-numbers text-[11px] hover:bg-rose-50 cursor-pointer transition-colors"
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-rose-100/70 pointer-events-none transition-all duration-300"
                    style={{ width: `${depthPct}%` }}
                  />
                  <div className="text-rose-600 font-semibold z-10">${ask.price.toFixed(2)}</div>
                  <div className="text-right text-slate-700 z-10">{ask.size.toFixed(4)}</div>
                  <div className="text-right text-slate-400 z-10">{ask.total.toFixed(4)}</div>
                </div>
              );
            })}
          </div>

          {/* SPREAD & CURRENT PRICE TICKER */}
          <div className="my-2 py-2 px-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between font-mono-numbers">
            <div className="flex items-center gap-2">
              <span className={`text-base font-extrabold ${priceDirection === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priceDirection === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {priceDirection === 'up' ? '▲' : '▼'}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-2 font-medium">
              <span>Spread: <strong className="text-slate-900">${spread.toFixed(2)}</strong></span>
            </div>
          </div>

          {/* BIDS (Buy Orders - Green) */}
          <div className="flex flex-col overflow-hidden flex-1 space-y-0.5 py-1">
            {orderBook.bids.slice(0, 7).map((bid, idx) => {
              const depthPct = Math.min(100, (bid.total / maxTotal) * 100);
              return (
                <div
                  key={`bid_${idx}`}
                  className="relative grid grid-cols-3 px-2 py-0.5 font-mono-numbers text-[11px] hover:bg-emerald-50 cursor-pointer transition-colors"
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-emerald-100/70 pointer-events-none transition-all duration-300"
                    style={{ width: `${depthPct}%` }}
                  />
                  <div className="text-emerald-600 font-semibold z-10">${bid.price.toFixed(2)}</div>
                  <div className="text-right text-slate-700 z-10">{bid.size.toFixed(4)}</div>
                  <div className="text-right text-slate-400 z-10">{bid.total.toFixed(4)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* RECENT TRADES TAPE */
        <div className="flex flex-col flex-1 p-3 overflow-y-auto">
          <div className="grid grid-cols-3 px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono-numbers border-b border-slate-200">
            <div>Price (USD)</div>
            <div className="text-right">Amount (BTC)</div>
            <div className="text-right">Time</div>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto">
            {recentTrades.map((t) => (
              <div key={t.id} className="grid grid-cols-3 px-2 py-1.5 font-mono-numbers text-[11px] hover:bg-slate-50">
                <div className={t.side === 'BUY' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  ${t.price.toFixed(2)}
                </div>
                <div className="text-right text-slate-700 font-medium">{t.amount.toFixed(4)}</div>
                <div className="text-right text-slate-400 text-[10px]">{t.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
