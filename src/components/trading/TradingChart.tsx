import React, { useState, useEffect, useRef } from 'react';
import { Candle } from '../../types/exchange';
import { generateCandles, getCurrentPrice } from '../../services/marketService';

interface TradingChartProps {
  pair?: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({ pair = 'BTC/USD' }) => {
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [candles, setCandles] = useState<Candle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Generate and refresh candles
  useEffect(() => {
    const initialCandles = generateCandles(timeframe, 45);
    setCandles(initialCandles);

    const interval = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const currentP = getCurrentPrice();
        const updated = [...prev];
        const last = { ...updated[updated.length - 1] };
        last.close = currentP;
        last.high = Math.max(last.high, currentP);
        last.low = Math.min(last.low, currentP);
        updated[updated.length - 1] = last;
        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [timeframe]);

  // Draw chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background to clean white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const padTop = 25;
    const padBottom = 55;
    const padRight = 75; // Price scale area
    const chartHeight = height - padTop - padBottom;
    const chartWidth = width - padRight;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    const priceBuffer = (maxPrice - minPrice) * 0.1 || 10;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;

    const priceToY = (price: number) => {
      return padTop + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
    };

    const yToPrice = (y: number) => {
      const norm = (padTop + chartHeight - y) / chartHeight;
      return minPrice + norm * (maxPrice - minPrice);
    };

    // Draw Light Grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const p = minPrice + (i / gridSteps) * (maxPrice - minPrice);
      const y = priceToY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price labels on right
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(1), chartWidth + 8, y + 3);
    }
    ctx.setLineDash([]);

    // Candle metrics
    const candleCount = candles.length;
    const candleWidth = Math.max(5, (chartWidth / candleCount) * 0.7);
    const candleSpacing = chartWidth / candleCount;

    // Draw Volume Bars
    const volumeHeight = padBottom * 0.65;
    candles.forEach((c, idx) => {
      const x = idx * candleSpacing + candleSpacing / 2;
      const vHeight = (c.volume / (maxVolume || 1)) * volumeHeight;
      const vY = height - 20 - vHeight;
      const isUp = c.close >= c.open;

      ctx.fillStyle = isUp ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)';
      ctx.fillRect(x - candleWidth / 2, vY, candleWidth, vHeight);
    });

    // Calculate EMA 20 in vibrant Royal Blue
    const emaPeriod = 20;
    const k = 2 / (emaPeriod + 1);
    const emaPoints: { x: number; y: number }[] = [];
    let ema = candles[0].close;

    candles.forEach((c, idx) => {
      ema = c.close * k + ema * (1 - k);
      if (idx >= emaPeriod / 2) {
        const x = idx * candleSpacing + candleSpacing / 2;
        emaPoints.push({ x, y: priceToY(ema) });
      }
    });

    // Draw Candles
    candles.forEach((c, idx) => {
      const x = idx * candleSpacing + candleSpacing / 2;
      const isUp = c.close >= c.open;
      const openY = priceToY(c.open);
      const closeY = priceToY(c.close);
      const highY = priceToY(c.high);
      const lowY = priceToY(c.low);

      const color = isUp ? '#16a34a' : '#dc2626';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.2;

      // Wick
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw EMA 20 line in Royal Blue
    if (emaPoints.length > 1) {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(emaPoints[0].x, emaPoints[0].y);
      for (let i = 1; i < emaPoints.length; i++) {
        ctx.lineTo(emaPoints[i].x, emaPoints[i].y);
      }
      ctx.stroke();
    }

    // Last price line in Blue
    const lastPrice = candles[candles.length - 1].close;
    const lastY = priceToY(lastPrice);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(0, lastY);
    ctx.lineTo(chartWidth, lastY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price badge on right
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(chartWidth + 2, lastY - 9, 68, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(lastPrice.toFixed(1), chartWidth + 6, lastY + 3);

    // Crosshair & Tooltip
    if (mousePos && mousePos.x < chartWidth) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, padTop);
      ctx.lineTo(mousePos.x, height - 15);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartWidth, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const hoverPrice = yToPrice(mousePos.y);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(chartWidth + 2, mousePos.y - 9, 68, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(hoverPrice.toFixed(1), chartWidth + 6, mousePos.y + 3);
    }
  }, [candles, mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const chartWidth = rect.width - 75;
    const candleSpacing = chartWidth / candles.length;
    const idx = Math.floor(x / candleSpacing);
    if (idx >= 0 && idx < candles.length) {
      setHoveredCandle(candles[idx]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredCandle(null);
  };

  const activeCandle = hoveredCandle || (candles.length > 0 ? candles[candles.length - 1] : null);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Chart Top Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-slate-900 font-mono-numbers">
            <span className="text-blue-600">●</span> {pair}
          </div>

          {/* Timeframes */}
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 shadow-2xs">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicator Pills */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-blue-600 font-semibold">
              <span className="w-2.5 h-1 bg-blue-600 rounded-xs inline-block"></span> EMA 20
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">Vol</span>
          </div>
        </div>

        {/* OHLC Bar */}
        {activeCandle && (
          <div className="flex items-center gap-3 font-mono-numbers text-[11px] text-slate-500">
            <span>
              O: <strong className="text-slate-700">${activeCandle.open.toFixed(2)}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-600">${activeCandle.high.toFixed(2)}</strong>
            </span>
            <span>
              L: <strong className="text-rose-600">${activeCandle.low.toFixed(2)}</strong>
            </span>
            <span>
              C: <strong className={activeCandle.close >= activeCandle.open ? 'text-emerald-600' : 'text-rose-600'}>${activeCandle.close.toFixed(2)}</strong>
            </span>
            <span className="hidden md:inline">
              Vol: <strong className="text-slate-700">{activeCandle.volume.toFixed(2)} BTC</strong>
            </span>
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 min-h-[380px] w-full bg-white">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="absolute inset-0 w-full h-full cursor-crosshair"
        />
      </div>
    </div>
  );
};
