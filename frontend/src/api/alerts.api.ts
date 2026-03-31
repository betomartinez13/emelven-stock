import api from './axios';
import type { PaginatedResult } from '../types/common.types';
import type { Alert, AlertFilterParams } from '../types/alert.types';

export const alertsApi = {
  getAll: (params: AlertFilterParams) =>
    api.get<PaginatedResult<Alert>>('/alerts', { params }).then(r => r.data),

  getUnread: () =>
    api.get<Alert[]>('/alerts/unread').then(r => r.data),

  countUnread: () =>
    api.get<{ count: number }>('/alerts/count').then(r => r.data.count),

  markAsRead: (id: number) =>
    api.patch<Alert>(`/alerts/${id}/read`).then(r => r.data),

  markAllAsRead: () =>
    api.patch('/alerts/read-all').then(r => r.data),
};
