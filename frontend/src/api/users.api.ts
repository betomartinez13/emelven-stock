import api from './axios';
import type { User } from '../types/user.types';
import type { PaginatedResult, PaginationParams } from '../types/common.types';

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  role?: User['role'];
}

export const usersApi = {
  getAll: (params: PaginationParams) =>
    api.get<PaginatedResult<User>>('/users', { params }).then(r => r.data),

  getOne: (id: number) =>
    api.get<User>(`/users/${id}`).then(r => r.data),

  update: (id: number, data: Partial<User> & { password?: string }) =>
    api.patch<User>(`/users/${id}`, data).then(r => r.data),

  deactivate: (id: number) =>
    api.delete(`/users/${id}`).then(r => r.data),

  register: (data: RegisterRequest) =>
    api.post<User>('/auth/register', data).then(r => r.data),
};
