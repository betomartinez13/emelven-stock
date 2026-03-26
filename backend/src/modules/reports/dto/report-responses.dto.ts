// Monthly consumption
export interface MonthlyConsumptionItem {
  materialId: number;
  nombre: string;
  unidad: string;
  consumoPorMes: { mes: number; cantidad: number }[];
}

export interface MonthlyConsumptionResponse {
  year: number;
  labels: string[]; // ['Ene', 'Feb', 'Mar', ...]
  items: MonthlyConsumptionItem[];
}

// Project consumption
export interface ProjectConsumptionItem {
  materialId: number;
  nombre: string;
  unidad: string;
  cantidadUsada: number;
  porcentaje: number;
}

export interface ProjectConsumptionResponse {
  workOrder: {
    id: number;
    codigo: string;
    descripcion: string;
    cliente: string;
    estado: string;
    fechaInicio: string;
    fechaFin?: string;
  };
  materials: ProjectConsumptionItem[];
  totalMovimientos: number;
}

// KPIs
export interface KpiResponse {
  totalMateriales: number;
  materialesConStockBajo: number;
  materialesSinStock: number;
  entradasDelMes: number;
  salidasDelMes: number;
  ordenesActivas: number;
  ordenesCompletadasMes: number;
  ventasMes: number;
  materialMasConsumido: { nombre: string; cantidad: number; unidad: string } | null;
}
