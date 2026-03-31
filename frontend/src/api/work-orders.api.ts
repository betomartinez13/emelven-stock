import api from './axios';
import type { PaginatedResult } from '../types/common.types';
import type { WorkOrder, WorkOrderStatus, WorkOrderFilterParams, CreateWorkOrderData, AddMaterialData, WorkOrderMaterial } from '../types/work-order.types';

export const workOrdersApi = {
  getAll: (params: WorkOrderFilterParams) =>
    api.get<PaginatedResult<WorkOrder>>('/work-orders', { params }).then(r => r.data),

  getOne: (id: number) =>
    api.get<WorkOrder>(`/work-orders/${id}`).then(r => r.data),

  create: (data: CreateWorkOrderData) =>
    api.post<WorkOrder>('/work-orders', data).then(r => r.data),

  updateStatus: (id: number, estado: WorkOrderStatus) =>
    api.patch<WorkOrder>(`/work-orders/${id}/status`, { estado }).then(r => r.data),

  addMaterial: (id: number, data: AddMaterialData) =>
    api.post<WorkOrderMaterial>(`/work-orders/${id}/materials`, data).then(r => r.data),
};
