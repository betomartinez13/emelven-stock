import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usersApi, type RegisterRequest } from '../api/users.api';
import type { User } from '../types/user.types';
import type { PaginationParams } from '../types/common.types';

const USERS_KEY = 'users';

export function useUsers(params: PaginationParams) {
  return useQuery({
    queryKey: [USERS_KEY, params],
    queryFn: () => usersApi.getAll(params),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterRequest) => usersApi.register(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
      toast.success('Usuario creado');
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> & { password?: string } }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
      toast.success('Usuario actualizado');
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
      toast.success('Usuario desactivado');
    },
  });
}
