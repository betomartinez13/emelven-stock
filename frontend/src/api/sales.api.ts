import api from './axios';
import type { PaginatedResult } from '../types/common.types';
import type { Sale, SaleFilterParams, CreateSaleData } from '../types/sale.types';

export const salesApi = {
  getAll: (params: SaleFilterParams) =>
    api.get<PaginatedResult<Sale>>('/sales', { params }).then(r => r.data),

  getOne: (id: number) =>
    api.get<Sale>(`/sales/${id}`).then(r => r.data),

  create: (data: CreateSaleData) =>
    api.post<Sale>('/sales', data).then(r => r.data),
};
