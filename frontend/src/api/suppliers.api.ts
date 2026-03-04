import api from './axios';
import type { Supplier, CreateSupplierData } from '../types/supplier.types';
import type { PaginatedResult, PaginationParams } from '../types/common.types';

export const suppliersApi = {
  getAll: (params: PaginationParams) =>
    api.get<PaginatedResult<Supplier>>('/suppliers', { params }).then(r => r.data),

  getOne: (id: number) =>
    api.get<Supplier>(`/suppliers/${id}`).then(r => r.data),

  create: (data: CreateSupplierData) =>
    api.post<Supplier>('/suppliers', data).then(r => r.data),

  update: (id: number, data: Partial<CreateSupplierData>) =>
    api.patch<Supplier>(`/suppliers/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/suppliers/${id}`).then(r => r.data),
};
