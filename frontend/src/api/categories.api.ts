import api from './axios';
import type { Category, CreateCategoryData } from '../types/category.types';

export const categoriesApi = {
  getAll: () =>
    api.get<Category[]>('/categories').then(r => r.data),

  create: (data: CreateCategoryData) =>
    api.post<Category>('/categories', data).then(r => r.data),

  update: (id: number, data: Partial<CreateCategoryData>) =>
    api.patch<Category>(`/categories/${id}`, data).then(r => r.data),

  remove: (id: number) =>
    api.delete(`/categories/${id}`).then(r => r.data),
};
