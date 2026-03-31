import { getStockStatus, STOCK_STATUS_CONFIG } from '../../types/material.types';

interface StockStatusBadgeProps {
  stockActual: number;
  stockMin: number;
  stockMax: number;
}

const DOT_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  low:      'bg-yellow-500',
  normal:   'bg-emerald-500',
  high:     'bg-blue-500',
};

export default function StockStatusBadge({ stockActual, stockMin, stockMax }: StockStatusBadgeProps) {
  const status = getStockStatus(stockActual, stockMin, stockMax);
  const { label } = STOCK_STATUS_CONFIG[status];
  const dotColor = DOT_COLORS[status] || 'bg-slate-500';

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-sm leading-none">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {label}
    </span>
  );
}
