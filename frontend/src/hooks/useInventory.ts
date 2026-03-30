import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryApi } from '../api/inventory.api';
import type { InventoryFilterParams, CreateEntryData, CreateExitData } from '../types/inventory.types';

export function useEntries(filters: InventoryFilterParams) {
  return useQuery({
    queryKey: ['inventory-entries', filters],
    queryFn: () => inventoryApi.getEntries(filters),
  });
}

export function useExits(filters: InventoryFilterParams) {
  return useQuery({
    queryKey: ['inventory-exits', filters],
    queryFn: () => inventoryApi.getExits(filters),
  });
}

export function useMovements(materialId: number | null) {
  return useQuery({
    queryKey: ['inventory-movements', materialId],
    queryFn: () => inventoryApi.getMovements(materialId!),
    enabled: !!materialId,
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEntryData) => inventoryApi.createEntry(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-entries'] });
      qc.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Entrada registrada');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Error al registrar entrada');
    },
  });
}

export function useCreateExit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExitData) => inventoryApi.createExit(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-exits'] });
      qc.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Salida registrada');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Error al registrar salida');
    },
  });
}
