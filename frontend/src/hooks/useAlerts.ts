import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { alertsApi } from '../api/alerts.api';
import type { AlertFilterParams } from '../types/alert.types';

export function useUnreadCount() {
  return useQuery({
    queryKey: ['alerts-count'],
    queryFn: () => alertsApi.countUnread(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });
}

export function useUnreadAlerts() {
  return useQuery({
    queryKey: ['alerts-unread'],
    queryFn: () => alertsApi.getUnread(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });
}

export function useAlerts(filters: AlertFilterParams) {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => alertsApi.getAll(filters),
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts-count'] });
      qc.invalidateQueries({ queryKey: ['alerts-unread'] });
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => toast.error('Error al marcar alerta'),
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => alertsApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts-count'] });
      qc.invalidateQueries({ queryKey: ['alerts-unread'] });
      qc.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Todas las alertas marcadas como leídas');
    },
    onError: () => toast.error('Error al marcar alertas'),
  });
}
