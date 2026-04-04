import type { PaginationParams } from './common.types';

export type WorkOrderStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

export interface WorkOrderMaterial {
  id: number;
  workOrderId: number;
  materialId: number;
  material: { nombre: string; unidad: string };
  cantidadUsada: number;
  fecha: string;
}

export interface WorkOrder {
  id: number;
  codigo: string;
  descripcion: string;
  cliente: string;
  estado: WorkOrderStatus;
  fechaInicio: string;
  fechaFin?: string;
  materials: WorkOrderMaterial[];
  createdAt: string;
}

export const WO_STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string }> = {
  pendiente:   { label: 'Pendiente',   color: 'bg-slate-100 text-slate-700' },
  en_progreso: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700' },
  completada:  { label: 'Completada',  color: 'bg-emerald-100 text-emerald-700' },
  cancelada:   { label: 'Cancelada',   color: 'bg-red-100 text-red-700' },
};

export interface WorkOrderFilterParams extends PaginationParams {
  estado?: WorkOrderStatus;
}

export interface CreateWorkOrderData {
  descripcion: string;
  cliente: string;
  fechaInicio: string;
}

export interface AddMaterialData {
  materialId: number;
  cantidadUsada: number;
}

export interface UpdateWorkOrderData {
  descripcion?: string;
  cliente?: string;
}
