import api from './axios';
import type { PaginatedResult } from '../types/common.types';
import type { AuditLog, AuditFilterParams } from '../types/audit.types';

export const auditLogApi = {
  getAll: (params: AuditFilterParams) =>
    api.get<PaginatedResult<AuditLog>>('/audit-log', { params }).then(r => r.data),
};
