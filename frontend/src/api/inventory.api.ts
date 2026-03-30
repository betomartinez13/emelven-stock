import api from './axios';
import type { PaginatedResult } from '../types/common.types';
import type { InventoryEntry, InventoryExit, MovementItem, InventoryFilterParams, CreateEntryData, CreateExitData } from '../types/inventory.types';

export const inventoryApi = {
  getEntries: (params: InventoryFilterParams) =>
    api.get<PaginatedResult<InventoryEntry>>('/inventory/entries', { params }).then(r => r.data),

  getExits: (params: InventoryFilterParams) =>
    api.get<PaginatedResult<InventoryExit>>('/inventory/exits', { params }).then(r => r.data),

  getMovements: (materialId: number) =>
    api.get<MovementItem[]>(`/inventory/movements/${materialId}`).then(r => r.data),

  createEntry: (data: CreateEntryData) =>
    api.post<InventoryEntry>('/inventory/entries', data).then(r => r.data),

  createExit: (data: CreateExitData) =>
    api.post<InventoryExit>('/inventory/exits', data).then(r => r.data),
};
