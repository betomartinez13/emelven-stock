import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { workOrdersApi } from '../api/work-orders.api';
import type { WorkOrderFilterParams, CreateWorkOrderData, WorkOrderStatus, AddMaterialData } from '../types/work-order.types';

type ApiError = AxiosError<{ message?: string }>;

export function useWorkOrders(filters: WorkOrderFilterParams) {
  return useQuery({
    queryKey: ['work-orders', filters],
    queryFn: () => workOrdersApi.getAll(filters),
  });
}

export function useWorkOrder(id: number | null) {
  return useQuery({
    queryKey: ['work-orders', id],
    queryFn: () => workOrdersApi.getOne(id!),
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkOrderData) => workOrdersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Orden de trabajo creada');
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.message ?? 'Error al crear orden de trabajo');
    },
  });
}

export function useUpdateWorkOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: WorkOrderStatus }) =>
      workOrdersApi.updateStatus(id, estado),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['work-orders', id] });
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Estado actualizado');
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.message ?? 'Error al actualizar estado');
    },
  });
}

export function useAddMaterial(workOrderId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMaterialData) => workOrdersApi.addMaterial(workOrderId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders', workOrderId] });
      qc.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material agregado');
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.message ?? 'Error al agregar material');
    },
  });
}
