import api from './axios';
import type { LoginRequest, LoginResponse } from '../types/user.types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then(r => r.data),

  profile: () =>
    api.get<LoginResponse['user']>('/auth/profile').then(r => r.data),
};
