import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';

export function useMonthlyReport(year: number) {
  return useQuery({
    queryKey: ['reports', 'monthly', year],
    queryFn: () => reportsApi.getMonthly(year),
  });
}

export function useProjectReport(workOrderId: number | null) {
  return useQuery({
    queryKey: ['reports', 'project', workOrderId],
    queryFn: () => reportsApi.getProjectConsumption(workOrderId!),
    enabled: !!workOrderId,
  });
}

export function useKpis() {
  return useQuery({
    queryKey: ['reports', 'kpi'],
    queryFn: () => reportsApi.getKpis(),
    refetchInterval: 5 * 60_000,
  });
}
