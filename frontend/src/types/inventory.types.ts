import type { PaginationParams } from './common.types';

export interface InventoryEntry {
  id: number;
  materialId: number;
  material: { id: number; nombre: string; unidad: string };
  cantidad: number;
  fechaEntrada: string;
  observacion?: string;
  userId: number;
  user: { nombre: string; apellido: string };
  createdAt: string;
}

export interface InventoryExit {
  id: number;
  materialId: number;
  material: { id: number; nombre: string; unidad: string };
  cantidad: number;
  fechaSalida: string;
  motivo?: string;
  workOrderId?: number;
  workOrder?: { id: number; codigo: string };
  userId: number;
  user: { nombre: string; apellido: string };
  createdAt: string;
}

export interface MovementItem {
  type: 'entry' | 'exit';
  id: number;
  cantidad: number;
  fecha: string;
  observacion?: string;
  motivo?: string;
  user: { nombre: string; apellido: string };
  workOrder?: { codigo: string };
}

export interface InventoryFilterParams extends PaginationParams {
  materialId?: number;
  desde?: string;
  hasta?: string;
}

export interface CreateEntryData {
  materialId: number;
  cantidad: number;
  fechaEntrada: string;
  observacion?: string;
}

export interface CreateExitData {
  materialId: number;
  cantidad: number;
  fechaSalida: string;
  motivo?: string;
  workOrderId?: number;
}
