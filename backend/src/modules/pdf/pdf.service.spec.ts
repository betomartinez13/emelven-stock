import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import { MonthlyConsumptionResponse, ProjectConsumptionResponse } from '../reports/dto/report-responses.dto';
import { Material } from '../materials/entities/material.entity';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const mockMonthlyData = (): MonthlyConsumptionResponse => ({
  year: 2026,
  labels: MONTH_LABELS,
  items: [
    {
      materialId: 1,
      nombre: 'Cable de cobre',
      unidad: 'm',
      consumoPorMes: MONTH_LABELS.map((_, i) => ({ mes: i + 1, cantidad: i === 2 ? 50 : 0 })),
    },
    {
      materialId: 2,
      nombre: 'Aceite dieléctrico',
      unidad: 'L',
      consumoPorMes: MONTH_LABELS.map((_, i) => ({ mes: i + 1, cantidad: i === 0 ? 30 : 0 })),
    },
  ],
});

const mockProjectData = (): ProjectConsumptionResponse => ({
  workOrder: {
    id: 1,
    codigo: 'OT-2026-001',
    descripcion: 'Transformador 500 KVA',
    cliente: 'Corpoelec',
    estado: 'completada',
    fechaInicio: '2026-01-01',
    fechaFin: '2026-02-01',
  },
  materials: [
    { materialId: 1, nombre: 'Cable de cobre', unidad: 'm', cantidadUsada: 80, porcentaje: 80 },
    { materialId: 2, nombre: 'Aceite dieléctrico', unidad: 'L', cantidadUsada: 20, porcentaje: 20 },
  ],
  totalMovimientos: 2,
});

const mockMaterials = (): Material[] =>
  [
    {
      id: 1,
      nombre: 'Cable de cobre',
      unidad: 'm',
      stockActual: 450,
      stockMin: 50,
      stockMax: 1000,
      categoryId: 1,
      category: { id: 1, nombre: 'Conductores' } as any,
      supplier: null,
      stockStatus: 'normal',
    } as unknown as Material,
    {
      id: 2,
      nombre: 'Aceite dieléctrico',
      unidad: 'L',
      stockActual: 5,
      stockMin: 20,
      stockMax: 200,
      categoryId: 1,
      category: { id: 1, nombre: 'Dieléctricos' } as any,
      supplier: null,
      stockStatus: 'low',
    } as unknown as Material,
  ];

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile();

    service = module.get<PdfService>(PdfService);
  });

  describe('generateMonthlyReport', () => {
    it('returns a non-empty Buffer', async () => {
      const buffer = await service.generateMonthlyReport(mockMonthlyData(), 'Admin Test');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
    }, 15000);

    it('with empty items still returns a valid PDF', async () => {
      const emptyData: MonthlyConsumptionResponse = { year: 2020, labels: MONTH_LABELS, items: [] };

      const buffer = await service.generateMonthlyReport(emptyData, 'Admin Test');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
    }, 15000);
  });

  describe('generateProjectReport', () => {
    it('returns a non-empty Buffer', async () => {
      const buffer = await service.generateProjectReport(mockProjectData(), 'Admin Test');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
    }, 15000);
  });

  describe('generateInventoryStatusReport', () => {
    it('returns a non-empty Buffer', async () => {
      const buffer = await service.generateInventoryStatusReport(mockMaterials(), 'Admin Test');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(100);
    }, 15000);
  });
});
