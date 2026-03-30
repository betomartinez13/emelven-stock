import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { materialsApi } from '../api/materials.api';
import type { MaterialFilterParams, CreateMaterialData } from '../types/material.types';

export function useMaterials(filters: MaterialFilterParams) {
  return useQuery({
    queryKey: ['materials', filters],
    queryFn: () => materialsApi.getAll(filters),
  });
}

export function useMaterial(id: number | null) {
  return useQuery({
    queryKey: ['materials', id],
    queryFn: () => materialsApi.getOne(id!),
    enabled: !!id,
  });
}

export function useLowStockMaterials() {
  return useQuery({
    queryKey: ['materials', 'low-stock'],
    queryFn: () => materialsApi.getLowStock(),
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaterialData) => materialsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material creado');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Error al crear material');
    },
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMaterialData> }) =>
      materialsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material actualizado');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Error al actualizar material');
    },
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => materialsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material eliminado');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'No se puede eliminar este material');
    },
  });
}
