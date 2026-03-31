import type { PaginationParams } from './common.types';

export type AlertType = 'stock_bajo' | 'stock_critico';

export interface Alert {
  id: number;
  materialId: number;
  material: { id: number; nombre: string; unidad: string; stockActual: number; stockMin: number };
  tipo: AlertType;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
}

export interface AlertFilterParams extends PaginationParams {
  tipo?: AlertType;
  leida?: boolean;
}
