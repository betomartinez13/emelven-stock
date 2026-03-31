import type { PaginationParams } from './common.types';

export interface Sale {
  id: number;
  workOrderId?: number;
  workOrder?: { id: number; codigo: string; descripcion: string };
  cliente: string;
  producto: string;
  cantidad: number;
  fecha: string;
  observacion?: string;
  userId: number;
  user: { nombre: string; apellido: string };
  createdAt: string;
}

export interface SaleFilterParams extends PaginationParams {
  cliente?: string;
  desde?: string;
  hasta?: string;
}

export interface CreateSaleData {
  workOrderId?: number;
  cliente: string;
  producto: string;
  cantidad: number;
  fecha: string;
  observacion?: string;
}
