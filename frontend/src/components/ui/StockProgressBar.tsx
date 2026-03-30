import { getStockStatus } from '../../types/material.types';

interface StockProgressBarProps {
  stockActual: number;
  stockMin: number;
  stockMax: number;
}

const colorByStatus: Record<string, string> = {
  critical: 'bg-red-500',
  low:      'bg-yellow-400',
  normal:   'bg-green-500',
  high:     'bg-blue-500',
};

export default function StockProgressBar({ stockActual, stockMin, stockMax }: StockProgressBarProps) {
  const status = getStockStatus(stockActual, stockMin, stockMax);
  const barColor = colorByStatus[status];
  const max = stockMax > 0 ? stockMax : Math.max(stockActual, stockMin) * 1.5 || 1;
  const pct = Math.min((stockActual / max) * 100, 100);
  const minPct = stockMax > 0 ? (stockMin / max) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{stockActual}</span>
        <span className="text-gray-400">/{stockMax > 0 ? stockMax : '—'}</span>
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        {/* Min marker */}
        {minPct > 0 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-orange-400 z-10"
            style={{ left: `${minPct}%` }}
          />
        )}
        {/* Fill bar */}
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
