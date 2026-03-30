import type { PaginationParams } from './common.types';

export type StockStatus = 'critical' | 'low' | 'normal' | 'high';

export interface Material {
  id: number;
  nombre: string;
  descripcion?: string;
  unidad: string;
  stockActual: number;
  stockMin: number;
  stockMax: number;
  categoryId: number;
  supplierId?: number;
  category: { id: number; nombre: string };
  supplier?: { id: number; nombre: string };
  createdAt: string;
  updatedAt: string;
}

export interface StockStatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

export const STOCK_STATUS_CONFIG: Record<StockStatus, StockStatusConfig> = {
  critical: { label: 'Sin Stock',  color: 'text-red-800',    bgColor: 'bg-red-100' },
  low:      { label: 'Stock Bajo', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  normal:   { label: 'Normal',     color: 'text-green-800',  bgColor: 'bg-green-100' },
  high:     { label: 'Exceso',     color: 'text-blue-800',   bgColor: 'bg-blue-100' },
};

export function getStockStatus(stockActual: number, stockMin: number, stockMax: number): StockStatus {
  if (stockActual <= 0) return 'critical';
  if (stockActual < stockMin) return 'low';
  if (stockMax > 0 && stockActual >= stockMax) return 'high';
  return 'normal';
}

export interface MaterialFilterParams extends PaginationParams {
  categoryId?: number;
  status?: StockStatus;
}

export interface CreateMaterialData {
  nombre: string;
  descripcion?: string;
  unidad: string;
  stockActual?: number;
  stockMin: number;
  stockMax: number;
  categoryId: number;
  supplierId?: number;
}
