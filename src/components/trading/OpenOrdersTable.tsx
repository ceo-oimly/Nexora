import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserOrders, getUserOrderFills, cancelOrder } from '../../services/ledgerService';

interface OpenOrdersTableProps {
  refreshTrigger?: number;
  onOrderUpdated?: () => void;
}

export const OpenOrdersTable: React.FC<OpenOrdersTableProps> = ({ refreshTrigger, onOrderUpdated }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'open' | 'all' | 'fills'>('open');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-sm">
        Please sign in to view your orders and executions.
      </div>
    );
  }

  const allOrders = getUserOrders(user.userId);
  const openOrders = allOrders.filter((o) => o.status === 'OPEN' || o.status === 'PENDING');
  const fills = getUserOrderFills(user.userId);

  const displayedOrders = activeTab === 'open' ? openOrders : allOrders;

  const handleCancel = (orderId: string) => {
    const res = cancelOrder(user.userId, orderId);
    if (res.success) {
      setActionMessage('Order successfully cancelled. Reserved funds returned to available balance.');
      setTimeout(() => setActionMessage(null), 3500);
      onOrderUpdated?.();
    } else {
      setActionMessage(res.message || 'Failed to cancel order.');
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-xs">
      {/* Table Navigation Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'open'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            Open Orders ({openOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            Order History ({allOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('fills')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'fills'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            Trade Fills ({fills.length})
          </button>
        </div>

        {actionMessage && (
          <span className="text-xs text-blue-600 font-semibold animate-pulse">
            {actionMessage}
          </span>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[160px]">
        {activeTab !== 'fills' ? (
          displayedOrders.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              {activeTab === 'open' ? 'No open orders at this time.' : 'No orders recorded yet.'}
            </div>
          ) : (
            <table className="w-full text-left font-mono-numbers">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Pair</th>
                  <th className="px-3 py-3">Side</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Price (USD)</th>
                  <th className="px-3 py-3">Amount (BTC)</th>
                  <th className="px-3 py-3">Filled</th>
                  <th className="px-3 py-3">Remaining</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Date / Time</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-900">{order.pair}</td>
                    <td className="px-3 py-3 font-bold">
                      <span className={order.side === 'BUY' ? 'text-emerald-600' : 'text-rose-600'}>
                        {order.side}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600 font-medium">{order.type}</td>
                    <td className="px-3 py-3 text-slate-900 font-semibold">
                      ${order.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-slate-800 font-medium">{order.amount.toFixed(4)}</td>
                    <td className="px-3 py-3 text-slate-500">{order.filledAmount.toFixed(4)}</td>
                    <td className="px-3 py-3 text-slate-500">{order.remainingAmount.toFixed(4)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === 'FILLED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.status === 'OPEN'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : order.status === 'CANCELLED'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500 text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {order.status === 'OPEN' && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : fills.length === 0 ? (
          <div className="py-14 text-center text-slate-400">No trade executions on record.</div>
        ) : (
          <table className="w-full text-left font-mono-numbers">
            <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Execution Time</th>
                <th className="px-3 py-3">Pair</th>
                <th className="px-3 py-3">Side</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Fee</th>
                <th className="px-3 py-3">Total Value</th>
                <th className="px-5 py-3 text-right">Order Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fills.map((fill) => (
                <tr key={fill.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3 text-slate-500 text-[11px]">
                    {new Date(fill.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-3 font-bold text-slate-900">{fill.pair}</td>
                  <td className="px-3 py-3 font-bold">
                    <span className={fill.side === 'BUY' ? 'text-emerald-600' : 'text-rose-600'}>
                      {fill.side}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-900 font-semibold">${fill.price.toLocaleString()}</td>
                  <td className="px-3 py-3 text-slate-800">{fill.amount.toFixed(4)} BTC</td>
                  <td className="px-3 py-3 text-blue-600 font-medium">${fill.fee.toFixed(2)}</td>
                  <td className="px-3 py-3 text-slate-900 font-bold">${fill.total.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-slate-400 text-[11px]">{fill.orderId.slice(0, 10)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
