import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserWallets, placeOrder } from '../../services/ledgerService';
import { getCurrentPrice } from '../../services/marketService';
import { OrderSide, OrderType } from '../../types/exchange';

interface OrderEntryProps {
  onOrderPlaced?: () => void;
}

export const OrderEntry: React.FC<OrderEntryProps> = ({ onOrderPlaced }) => {
  const { user } = useAuth();
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [amount, setAmount] = useState<string>('0.05');
  const [limitPrice, setLimitPrice] = useState<string>(getCurrentPrice().toString());
  const [stopPrice, setStopPrice] = useState<string>((getCurrentPrice() * 0.98).toFixed(2));
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const currentPrice = getCurrentPrice();
  const wallets = user ? getUserWallets(user.userId) : [];
  const btcWallet = wallets.find((w) => w.asset === 'BTC');
  const usdWallet = wallets.find((w) => w.asset === 'USD');

  const parsedAmount = parseFloat(amount) || 0;
  const parsedPrice = orderType === 'MARKET' ? currentPrice : parseFloat(limitPrice) || currentPrice;
  const parsedStopPrice = parseFloat(stopPrice) || currentPrice;

  // Fee calculation (0.1%)
  const grossTotal = Number((parsedAmount * parsedPrice).toFixed(2));
  const feeRate = 0.001;
  const estimatedFee = Number((grossTotal * feeRate).toFixed(2));
  const finalTotal = side === 'BUY' ? Number((grossTotal + estimatedFee).toFixed(2)) : Number((grossTotal - estimatedFee).toFixed(2));

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePercentageClick = (pct: number) => {
    if (!usdWallet || !btcWallet) return;
    if (side === 'BUY') {
      const maxUsd = usdWallet.availableBalance * (pct / 100);
      const estBtc = maxUsd / (parsedPrice * 1.001);
      setAmount(Math.max(0, Number(estBtc.toFixed(4))).toString());
    } else {
      const maxBtc = btcWallet.availableBalance * (pct / 100);
      setAmount(Math.max(0, Number(maxBtc.toFixed(4))).toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to trade.', true);
      return;
    }

    if (parsedAmount <= 0) {
      showToast('Please enter a valid amount greater than 0.', true);
      return;
    }

    setSubmitting(true);

    try {
      const result = placeOrder({
        userId: user.userId,
        pair: 'BTC/USD',
        type: orderType,
        side,
        amount: parsedAmount,
        price: orderType === 'LIMIT' ? parsedPrice : undefined,
        limitPrice: orderType === 'STOP_LIMIT' ? parsedPrice : undefined,
        stopPrice: orderType === 'STOP_LIMIT' ? parsedStopPrice : undefined,
      });

      if (!result.success) {
        showToast(result.message || 'Order execution failed.', true);
      } else {
        showToast(
          `Successfully executed ${orderType} ${side} order for ${parsedAmount} BTC at $${parsedPrice.toLocaleString()}!`
        );
        onOrderPlaced?.();
      }
    } catch (err: any) {
      showToast(err.message || 'Execution error.', true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-4 text-xs">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`mb-3 p-3 rounded-xl text-xs font-semibold border flex items-center justify-between ${
            toastMessage.isError
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Side Toggle: BUY / SELL */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 mb-3">
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`py-2 rounded-lg font-bold text-xs tracking-wider transition-all ${
            side === 'BUY'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          BUY BTC
        </button>
        <button
          type="button"
          onClick={() => setSide('SELL')}
          className={`py-2 rounded-lg font-bold text-xs tracking-wider transition-all ${
            side === 'SELL'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          SELL BTC
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex items-center gap-1.5 mb-3 border-b border-slate-100 pb-2.5">
        {(['MARKET', 'LIMIT', 'STOP_LIMIT'] as OrderType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setOrderType(type)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              orderType === type
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {type.replace('_', '-')}
          </button>
        ))}
      </div>

      {/* Available Balance Quick Badges */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-xs font-mono-numbers">
        <span className="text-slate-500 font-medium">Available:</span>
        <div className="flex items-center gap-2">
          <span className="text-emerald-700 font-bold">
            ${usdWallet?.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'} USD
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-blue-700 font-bold">
            {btcWallet?.availableBalance.toFixed(4) ?? '0.0000'} BTC
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Stop Price Input (STOP-LIMIT only) */}
        {orderType === 'STOP_LIMIT' && (
          <div>
            <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
              <label>Stop Trigger Price</label>
              <span>USD</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />
              <span className="absolute right-3.5 top-2 text-slate-400 text-xs">USD</span>
            </div>
          </div>
        )}

        {/* Limit Price Input (LIMIT or STOP-LIMIT) */}
        {(orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && (
          <div>
            <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
              <label>Order Price</label>
              <button
                type="button"
                onClick={() => setLimitPrice(currentPrice.toString())}
                className="text-blue-600 font-semibold hover:underline"
              >
                Use Best Market
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />
              <span className="absolute right-3.5 top-2 text-slate-400 text-xs">USD</span>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
            <label>Amount</label>
            <span>BTC</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono-numbers focus:outline-none focus:border-blue-500"
              placeholder="0.00"
              required
            />
            <span className="absolute right-3.5 top-2 text-slate-400 text-xs">BTC</span>
          </div>
        </div>

        {/* Quick Percentage Slider / Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handlePercentageClick(pct)}
              className="py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-mono-numbers text-slate-600 hover:text-blue-700 font-semibold transition-colors"
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* Fee & Calculation Summary */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono-numbers">
          <div className="flex justify-between text-slate-500">
            <span>Execution Price:</span>
            <span className="text-slate-800 font-semibold">${parsedPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Subtotal:</span>
            <span className="text-slate-800 font-semibold">${grossTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Exchange Fee (0.1%):</span>
            <span className="text-blue-600 font-medium">${estimatedFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5">
            <span>Net Settlement:</span>
            <span className={side === 'BUY' ? 'text-emerald-600' : 'text-slate-900'}>
              ${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Submit Execution Button */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md ${
            side === 'BUY'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-98'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 active:scale-98'
          } ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {submitting ? 'Executing Order...' : `${side} BTC`}
        </button>

        <p className="text-[11px] text-center text-slate-500">
          Atomic double-entry ledger settlement enforced.
        </p>
      </form>
    </div>
  );
};
