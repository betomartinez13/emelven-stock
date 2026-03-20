import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { WorkOrderMaterial } from './entities/work-order-material.entity';
import { InventoryService } from '../inventory/inventory.service';

const mockWorkOrder = (overrides = {}): WorkOrder =>
  ({
    id: 1,
    codigo: 'OT-2025-001',
    descripcion: 'Transformador 500 KVA',
    cliente: 'Cliente Test',
    estado: WorkOrderStatus.PENDING,
    fechaInicio: new Date('2025-01-01'),
    fechaFin: null,
    materials: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as WorkOrder);

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockInventoryService = () => ({
  createExit: jest.fn(),
});

describe('WorkOrdersService', () => {
  let service: WorkOrdersService;
  let workOrdersRepo: ReturnType<typeof mockRepo>;
  let workOrderMaterialsRepo: ReturnType<typeof mockRepo>;
  let inventoryService: ReturnType<typeof mockInventoryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        { provide: getRepositoryToken(WorkOrder), useFactory: mockRepo },
        { provide: getRepositoryToken(WorkOrderMaterial), useFactory: mockRepo },
        { provide: InventoryService, useFactory: mockInventoryService },
      ],
    }).compile();

    service = module.get<WorkOrdersService>(WorkOrdersService);
    workOrdersRepo = module.get(getRepositoryToken(WorkOrder));
    workOrderMaterialsRepo = module.get(getRepositoryToken(WorkOrderMaterial));
    inventoryService = module.get(InventoryService);
  });

  describe('create', () => {
    it('generates code in OT-YYYY-NNN format', async () => {
      workOrdersRepo.count.mockResolvedValue(0);
      const wo = mockWorkOrder({ codigo: `OT-${new Date().getFullYear()}-001` });
      workOrdersRepo.create.mockReturnValue(wo);
      workOrdersRepo.save.mockResolvedValue(wo);

      const result = await service.create({
        descripcion: 'Transformador 500 KVA',
        cliente: 'Cliente Test',
        fechaInicio: '2025-01-01',
      });

      expect(result.codigo).toMatch(/^OT-\d{4}-\d{3}$/);
    });

    it('increments code counter correctly', async () => {
      workOrdersRepo.count.mockResolvedValue(5);
      const year = new Date().getFullYear();
      const wo = mockWorkOrder({ codigo: `OT-${year}-006` });
      workOrdersRepo.create.mockReturnValue(wo);
      workOrdersRepo.save.mockResolvedValue(wo);

      const result = await service.create({
        descripcion: 'Transformador',
        cliente: 'Cliente',
        fechaInicio: '2025-01-01',
      });

      expect(result.codigo).toBe(`OT-${year}-006`);
    });
  });

  describe('updateStatus', () => {
    it('allows valid transition pendiente → en_progreso', async () => {
      const wo = mockWorkOrder({ estado: WorkOrderStatus.PENDING });
      workOrdersRepo.findOne.mockResolvedValue(wo);
      workOrdersRepo.save.mockResolvedValue({ ...wo, estado: WorkOrderStatus.IN_PROGRESS });

      const result = await service.updateStatus(1, { estado: WorkOrderStatus.IN_PROGRESS });
      expect(result.estado).toBe(WorkOrderStatus.IN_PROGRESS);
    });

    it('throws BadRequestException for invalid transition completada → en_progreso', async () => {
      const wo = mockWorkOrder({ estado: WorkOrderStatus.COMPLETED });
      workOrdersRepo.findOne.mockResolvedValue(wo);

      await expect(service.updateStatus(1, { estado: WorkOrderStatus.IN_PROGRESS }))
        .rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid transition cancelada → pendiente', async () => {
      const wo = mockWorkOrder({ estado: WorkOrderStatus.CANCELLED });
      workOrdersRepo.findOne.mockResolvedValue(wo);

      await expect(service.updateStatus(1, { estado: WorkOrderStatus.PENDING }))
        .rejects.toThrow(BadRequestException);
    });

    it('sets fechaFin when transitioning to completada', async () => {
      const wo = mockWorkOrder({ estado: WorkOrderStatus.IN_PROGRESS });
      workOrdersRepo.findOne.mockResolvedValue(wo);
      workOrdersRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.updateStatus(1, { estado: WorkOrderStatus.COMPLETED });
      expect(result.fechaFin).toBeDefined();
      expect(result.fechaFin).toBeInstanceOf(Date);
    });
  });

  describe('addMaterial', () => {
    it('throws BadRequestException if work order is not IN_PROGRESS', async () => {
      const wo = mockWorkOrder({ estado: WorkOrderStatus.PENDING });
      workOrdersRepo.findOne.mockResolvedValue(wo);

      await expect(service.addMaterial(1, { materialId: 1, cantidadUsada: 5 }, 1))
        .rejects.toThrow(BadRequestException);
    });

    it('calls inventoryService.createExit when work order is IN_PROGRESS', async () => {
      const wo = mockWorkOrder({ estado: WorkOrderStatus.IN_PROGRESS });
      workOrdersRepo.findOne.mockResolvedValue(wo);
      inventoryService.createExit.mockResolvedValue({ id: 1 });
      const wom = { id: 1, workOrderId: 1, materialId: 2, cantidadUsada: 5, fecha: new Date() };
      workOrderMaterialsRepo.create.mockReturnValue(wom);
      workOrderMaterialsRepo.save.mockResolvedValue(wom);

      await service.addMaterial(1, { materialId: 2, cantidadUsada: 5 }, 1);
      expect(inventoryService.createExit).toHaveBeenCalledWith(
        expect.objectContaining({ materialId: 2, cantidad: 5, workOrderId: 1 }),
        1,
      );
    });

    it('propagates BadRequestException from inventoryService when insufficient stock', async () => {
      const wo = mockWorkOrder({ estado: WorkOrderStatus.IN_PROGRESS });
      workOrdersRepo.findOne.mockResolvedValue(wo);
      inventoryService.createExit.mockRejectedValue(
        new BadRequestException('Stock insuficiente'),
      );

      await expect(service.addMaterial(1, { materialId: 2, cantidadUsada: 9999 }, 1))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('returns work order when found', async () => {
      workOrdersRepo.findOne.mockResolvedValue(mockWorkOrder());
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('throws NotFoundException when not found', async () => {
      workOrdersRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });
});
