import type { PaginationParams } from './common.types';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: number;
  userId: number;
  user: { nombre: string; apellido: string; email: string };
  entidad: string;
  entidadId: number;
  accion: AuditAction;
  datosAntes: Record<string, unknown> | null;
  datosDespues: Record<string, unknown> | null;
  fecha: string;
}

export interface AuditFilterParams extends PaginationParams {
  entidad?: string;
  accion?: AuditAction;
  fechaDesde?: string;
  fechaHasta?: string;
}
