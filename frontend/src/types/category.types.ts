export interface Category {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface CreateCategoryData {
  nombre: string;
  descripcion?: string;
}
