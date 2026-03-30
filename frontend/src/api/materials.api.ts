import api from './axios';
import type { PaginatedResult } from '../types/common.types';
import type { Material, MaterialFilterParams, CreateMaterialData } from '../types/material.types';

export const materialsApi = {
  getAll: (params: MaterialFilterParams) =>
    api.get<PaginatedResult<Material>>('/materials', { params }).then(r => r.data),

  getLowStock: () =>
    api.get<Material[]>('/materials/low-stock').then(r => r.data),

  getOne: (id: number) =>
    api.get<Material>(`/materials/${id}`).then(r => r.data),

  create: (data: CreateMaterialData) =>
    api.post<Material>('/materials', data).then(r => r.data),

  update: (id: number, data: Partial<CreateMaterialData>) =>
    api.patch<Material>(`/materials/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/materials/${id}`).then(r => r.data),
};
