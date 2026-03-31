import { useQuery } from '@tanstack/react-query';
import { auditLogApi } from '../api/audit-log.api';
import type { AuditFilterParams } from '../types/audit.types';

export function useAuditLog(filters: AuditFilterParams) {
  return useQuery({
    queryKey: ['audit-log', filters],
    queryFn: () => auditLogApi.getAll(filters),
  });
}
