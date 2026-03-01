export type UserRole = 'admin' | 'warehouse' | 'manager';

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: Omit<User, 'isActive' | 'createdAt'>;
}
