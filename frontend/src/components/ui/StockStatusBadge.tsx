import { getStockStatus, STOCK_STATUS_CONFIG } from '../../types/material.types';

interface StockStatusBadgeProps {
  stockActual: number;
  stockMin: number;
  stockMax: number;
}

export default function StockStatusBadge({ stockActual, stockMin, stockMax }: StockStatusBadgeProps) {
  const status = getStockStatus(stockActual, stockMin, stockMax);
  const { label, color, bgColor } = STOCK_STATUS_CONFIG[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${color}`}>
      {label}
    </span>
  );
}
