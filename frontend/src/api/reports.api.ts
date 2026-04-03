import api from './axios';

export interface MonthlyMaterialData {
  nombre: string;
  consumoPorMes: { mes: number; cantidad: number }[];
}

export interface MonthlyConsumptionResponse {
  year: number;
  labels: string[];
  items: MonthlyMaterialData[];
}

export interface ProjectMaterialData {
  nombre: string;
  unidad: string;
  cantidadUsada: number;
  porcentaje: number;
}

export interface ProjectConsumptionResponse {
  workOrder: { id: number; codigo: string; cliente: string; descripcion: string; estado: string; fechaInicio: string; fechaFin?: string };
  materials: ProjectMaterialData[];
}

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

export const reportsApi = {
  getMonthly: (year: number) =>
    api.get<MonthlyConsumptionResponse>('/reports/monthly-consumption', { params: { year } }).then(r => r.data),

  getProjectConsumption: (workOrderId: number) =>
    api.get<ProjectConsumptionResponse>(`/reports/project-consumption/${workOrderId}`).then(r => r.data),

  getKpis: () =>
    api.get<KpiResponse>('/reports/kpi').then(r => r.data),
};
