import { getStockStatus } from '../../types/material.types';

interface StockProgressBarProps {
  stockActual: number;
  stockMin: number;
  stockMax: number;
}

const colorByStatus: Record<string, string> = {
  critical: 'bg-red-500 shadow-red-500/50',
  low:      'bg-yellow-400 shadow-yellow-400/50',
  normal:   'bg-emerald-500 shadow-emerald-500/50',
  high:     'bg-blue-500 shadow-blue-500/50',
};

export default function StockProgressBar({ stockActual, stockMin, stockMax }: StockProgressBarProps) {
  const status = getStockStatus(stockActual, stockMin, stockMax);
  const barColor = colorByStatus[status];
  const max = stockMax > 0 ? stockMax : Math.max(stockActual, stockMin) * 1.5 || 1;
  const pct = Math.min((stockActual / max) * 100, 100);
  const minPct = stockMax > 0 ? (stockMin / max) * 100 : 0;

  return (
    <div className="w-full max-w-[140px]">
      <div className="flex justify-between text-xs font-bold mb-1.5 tabular-nums">
        <span className="text-slate-800">{stockActual}</span>
        <span className="text-slate-400">/ {stockMax > 0 ? stockMax : '—'}</span>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 inner-shadow-sm">
        {/* Min marker */}
        {minPct > 0 && (
          <div
            className="absolute top-0 h-full w-[2px] bg-slate-400 z-10"
            style={{ left: `${minPct}%` }}
          />
        )}
        {/* Fill bar */}
        <div
          className={`h-full rounded-full transition-all duration-500 shadow-sm ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
