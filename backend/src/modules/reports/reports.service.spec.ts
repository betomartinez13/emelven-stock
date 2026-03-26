import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReportsService } from './reports.service';
import { Material } from '../materials/entities/material.entity';
import { WorkOrder, WorkOrderStatus } from '../work-orders/entities/work-order.entity';
import { Sale } from '../sales/entities/sale.entity';
import { InventoryEntry } from '../inventory/entities/inventory-entry.entity';
import { InventoryExit } from '../inventory/entities/inventory-exit.entity';

const mockRepo = () => ({
  count: jest.fn(),
  findOne: jest.fn(),
});

const mockDataSource = () => ({
  query: jest.fn(),
});

describe('ReportsService', () => {
  let service: ReportsService;
  let materialsRepo: ReturnType<typeof mockRepo>;
  let workOrdersRepo: ReturnType<typeof mockRepo>;
  let salesRepo: ReturnType<typeof mockRepo>;
  let dataSource: ReturnType<typeof mockDataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Material), useFactory: mockRepo },
        { provide: getRepositoryToken(WorkOrder), useFactory: mockRepo },
        { provide: getRepositoryToken(Sale), useFactory: mockRepo },
        { provide: getRepositoryToken(InventoryEntry), useFactory: mockRepo },
        { provide: getRepositoryToken(InventoryExit), useFactory: mockRepo },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    materialsRepo = module.get(getRepositoryToken(Material));
    workOrdersRepo = module.get(getRepositoryToken(WorkOrder));
    salesRepo = module.get(getRepositoryToken(Sale));
    dataSource = module.get(DataSource);
  });

  describe('getMonthlyConsumption', () => {
    it('returns data grouped by material with 12 months', async () => {
      dataSource.query.mockResolvedValue([
        { materialId: 1, nombre: 'Cable', unidad: 'm', mes: 1, cantidad: '50' },
        { materialId: 1, nombre: 'Cable', unidad: 'm', mes: 3, cantidad: '30' },
      ]);

      const result = await service.getMonthlyConsumption(2026);

      expect(result.year).toBe(2026);
      expect(result.labels).toHaveLength(12);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].materialId).toBe(1);
      expect(result.items[0].consumoPorMes).toHaveLength(12);
      expect(result.items[0].consumoPorMes[0].cantidad).toBe(50);  // January
      expect(result.items[0].consumoPorMes[2].cantidad).toBe(30);  // March
      expect(result.items[0].consumoPorMes[1].cantidad).toBe(0);   // February = 0
    });

    it('returns empty items when year has no exits', async () => {
      dataSource.query.mockResolvedValue([]);

      const result = await service.getMonthlyConsumption(2020);

      expect(result.year).toBe(2020);
      expect(result.items).toHaveLength(0);
    });

    it('handles multiple materials with exits in some months', async () => {
      dataSource.query.mockResolvedValue([
        { materialId: 1, nombre: 'Cable', unidad: 'm', mes: 2, cantidad: '100' },
        { materialId: 2, nombre: 'Aceite', unidad: 'L', mes: 2, cantidad: '25' },
      ]);

      const result = await service.getMonthlyConsumption(2026);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].consumoPorMes[1].cantidad).toBe(100);
      expect(result.items[1].consumoPorMes[1].cantidad).toBe(25);
    });
  });

  describe('getProjectConsumption', () => {
    const mockWorkOrder = {
      id: 1, codigo: 'OT-2026-001', descripcion: 'Transformador', cliente: 'Corpoelec',
      estado: WorkOrderStatus.COMPLETED, fechaInicio: new Date('2026-01-01'), fechaFin: new Date('2026-02-01'),
    } as WorkOrder;

    it('returns correct quantities per material', async () => {
      workOrdersRepo.findOne.mockResolvedValue(mockWorkOrder);
      dataSource.query.mockResolvedValue([
        { materialId: 1, nombre: 'Cable', unidad: 'm', cantidadUsada: '80' },
        { materialId: 2, nombre: 'Aceite', unidad: 'L', cantidadUsada: '20' },
      ]);

      const result = await service.getProjectConsumption(1);

      expect(result.workOrder.codigo).toBe('OT-2026-001');
      expect(result.materials).toHaveLength(2);
      expect(result.materials[0].cantidadUsada).toBe(80);
      expect(result.totalMovimientos).toBe(2);
    });

    it('calculates percentages correctly', async () => {
      workOrdersRepo.findOne.mockResolvedValue(mockWorkOrder);
      dataSource.query.mockResolvedValue([
        { materialId: 1, nombre: 'Cable', unidad: 'm', cantidadUsada: '75' },
        { materialId: 2, nombre: 'Aceite', unidad: 'L', cantidadUsada: '25' },
      ]);

      const result = await service.getProjectConsumption(1);

      expect(result.materials[0].porcentaje).toBe(75);
      expect(result.materials[1].porcentaje).toBe(25);
    });

    it('throws NotFoundException for invalid workOrderId', async () => {
      workOrdersRepo.findOne.mockResolvedValue(null);

      await expect(service.getProjectConsumption(9999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getKpis', () => {
    beforeEach(() => {
      materialsRepo.count
        .mockResolvedValueOnce(50)  // totalMateriales
        .mockResolvedValueOnce(3);  // materialesSinStock
      workOrdersRepo.count
        .mockResolvedValueOnce(5)   // ordenesActivas
        .mockResolvedValueOnce(2);  // ordenesCompletadasMes
      salesRepo.count.mockResolvedValue(8);
      dataSource.query
        .mockResolvedValueOnce([{ entradasDelMes: '12' }])
        .mockResolvedValueOnce([{ salidasDelMes: '7' }])
        .mockResolvedValueOnce([{ nombre: 'Cable', unidad: 'm', total: '200' }])
        .mockResolvedValueOnce([{ cnt: '4' }]);  // materialesConStockBajo
    });

    it('returns correct counts for all metrics', async () => {
      const result = await service.getKpis();

      expect(result.totalMateriales).toBe(50);
      expect(result.materialesSinStock).toBe(3);
      expect(result.materialesConStockBajo).toBe(4);
      expect(result.entradasDelMes).toBe(12);
      expect(result.salidasDelMes).toBe(7);
      expect(result.ordenesActivas).toBe(5);
      expect(result.ordenesCompletadasMes).toBe(2);
      expect(result.ventasMes).toBe(8);
      expect(result.materialMasConsumido).toEqual({ nombre: 'Cable', cantidad: 200, unidad: 'm' });
    });

    it('returns null materialMasConsumido when no exits this month', async () => {
      materialsRepo.count.mockReset();
      materialsRepo.count
        .mockResolvedValueOnce(10)  // totalMateriales
        .mockResolvedValueOnce(0);  // materialesSinStock
      workOrdersRepo.count.mockReset();
      workOrdersRepo.count
        .mockResolvedValueOnce(0)   // ordenesActivas
        .mockResolvedValueOnce(0);  // ordenesCompletadasMes
      salesRepo.count.mockResolvedValue(0);
      dataSource.query.mockReset();
      dataSource.query
        .mockResolvedValueOnce([{ entradasDelMes: '0' }])
        .mockResolvedValueOnce([{ salidasDelMes: '0' }])
        .mockResolvedValueOnce([])               // no top material
        .mockResolvedValueOnce([{ cnt: '0' }]);  // materialesConStockBajo

      const result = await service.getKpis();

      expect(result.materialMasConsumido).toBeNull();
    });
  });
});
