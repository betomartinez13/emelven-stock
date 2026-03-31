import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { salesApi } from '../api/sales.api';
import type { SaleFilterParams, CreateSaleData } from '../types/sale.types';

type ApiError = AxiosError<{ message?: string }>;

export function useSales(filters: SaleFilterParams) {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: () => salesApi.getAll(filters),
  });
}

export function useSale(id: number | null) {
  return useQuery({
    queryKey: ['sales', id],
    queryFn: () => salesApi.getOne(id!),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSaleData) => salesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venta registrada');
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.message ?? 'Error al registrar venta');
    },
  });
}
