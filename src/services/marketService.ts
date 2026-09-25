import { Candle, OrderBookLevel, RecentTrade, TickerData } from '../types/exchange';

// Live benchmark price
let currentPrice = 64850.50;
let previous24hOpen = 63200.00;
let high24h = 65420.00;
let low24h = 62980.00;
let volume24h = 18452.84;

// Attempt to fetch real live BTC price from public market API
let isLivePriceLoaded = false;
export const fetchLiveMarketPrice = async (): Promise<number> => {
  try {
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      const res = await window.fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
      if (res.ok) {
        const data = await res.json();
        const price = parseFloat(data?.data?.amount);
        if (price && !isNaN(price) && price > 1000) {
          currentPrice = Number(price.toFixed(2));
          if (!isLivePriceLoaded) {
            high24h = Number((currentPrice * 1.025).toFixed(2));
            low24h = Number((currentPrice * 0.975).toFixed(2));
            previous24hOpen = Number((currentPrice * 0.985).toFixed(2));
            isLivePriceLoaded = true;
          }
          return currentPrice;
        }
      }
    }
  } catch (e) {
    // Graceful fallback to benchmark oscillator
  }
  return currentPrice;
};

// Initial fetch and scheduled refresh in browser
if (typeof window !== 'undefined') {
  fetchLiveMarketPrice();
  setInterval(fetchLiveMarketPrice, 10000);
}

export const getTicker = (): TickerData => {
  const change24h = ((currentPrice - previous24hOpen) / previous24hOpen) * 100;
  const spread = 0.50;
  return {
    pair: 'BTC/USD',
    lastPrice: currentPrice,
    indexPrice: currentPrice + 0.15,
    change24h: Number(change24h.toFixed(2)),
    high24h: Math.max(high24h, currentPrice),
    low24h: Math.min(low24h, currentPrice),
    volume24h: Number(volume24h.toFixed(2)),
    liquidity: 48920150,
    spread,
  };
};

export const updateMarketTick = (priceDelta?: number): number => {
  const delta = priceDelta ?? (Math.random() - 0.495) * 6;
  currentPrice = Math.max(10000, Number((currentPrice + delta).toFixed(2)));
  if (currentPrice > high24h) high24h = currentPrice;
  if (currentPrice < low24h) low24h = currentPrice;
  volume24h += Math.abs(delta) * 0.05;
  return currentPrice;
};

export const getCurrentPrice = (): number => currentPrice;

export const generateOrderBook = (centerPrice = currentPrice): { asks: OrderBookLevel[]; bids: OrderBookLevel[] } => {
  const asks: OrderBookLevel[] = [];
  const bids: OrderBookLevel[] = [];

  let cumAskTotal = 0;
  for (let i = 1; i <= 10; i++) {
    const price = Number((centerPrice + i * 2.5 + Math.random() * 0.8).toFixed(2));
    const size = Number((0.15 + Math.random() * 1.8 * (1 + i * 0.1)).toFixed(4));
    cumAskTotal += size;
    asks.push({
      price,
      size,
      total: Number(cumAskTotal.toFixed(4)),
    });
  }

  let cumBidTotal = 0;
  for (let i = 1; i <= 10; i++) {
    const price = Number((centerPrice - i * 2.5 - Math.random() * 0.8).toFixed(2));
    const size = Number((0.15 + Math.random() * 1.8 * (1 + i * 0.1)).toFixed(4));
    cumBidTotal += size;
    bids.push({
      price,
      size,
      total: Number(cumBidTotal.toFixed(4)),
    });
  }

  return {
    asks: asks.reverse(),
    bids,
  };
};

export const generateInitialRecentTrades = (centerPrice = currentPrice): RecentTrade[] => {
  const trades: RecentTrade[] = [];
  const now = Date.now();
  for (let i = 0; i < 15; i++) {
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const offset = (Math.random() - 0.5) * 15;
    const time = new Date(now - i * 4000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    trades.push({
      id: `trade_${i}_${now}`,
      price: Number((centerPrice + offset).toFixed(2)),
      amount: Number((0.02 + Math.random() * 0.85).toFixed(4)),
      side,
      time,
    });
  }
  return trades;
};

export const generateCandles = (timeframe: string = '15m', count: number = 40): Candle[] => {
  const candles: Candle[] = [];
  const now = Date.now();
  
  let intervalMs = 15 * 60 * 1000;
  if (timeframe === '1m') intervalMs = 1 * 60 * 1000;
  if (timeframe === '5m') intervalMs = 5 * 60 * 1000;
  if (timeframe === '15m') intervalMs = 15 * 60 * 1000;
  if (timeframe === '1h') intervalMs = 60 * 60 * 1000;
  if (timeframe === '4h') intervalMs = 4 * 60 * 60 * 1000;
  if (timeframe === '1d') intervalMs = 24 * 60 * 60 * 1000;

  let base = currentPrice - (count * 15);
  for (let i = count; i >= 0; i--) {
    const time = now - i * intervalMs;
    const open = base;
    const change = (Math.random() - 0.48) * 80;
    const close = Math.max(10000, Number((open + change).toFixed(2)));
    const high = Number((Math.max(open, close) + Math.random() * 45).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * 45).toFixed(2));
    const volume = Number((5 + Math.random() * 40).toFixed(2));

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    });
    base = close;
  }

  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = currentPrice;
    last.high = Math.max(last.high, currentPrice);
    last.low = Math.min(last.low, currentPrice);
  }

  return candles;
};
