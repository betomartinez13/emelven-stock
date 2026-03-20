import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { Sale } from './entities/sale.entity';
import { WorkOrder, WorkOrderStatus } from '../work-orders/entities/work-order.entity';

const mockSale = (overrides = {}): Sale =>
  ({
    id: 1,
    cliente: 'Corpoelec',
    producto: 'Transformador 500 KVA',
    cantidad: 1,
    fecha: new Date(),
    observacion: null,
    workOrderId: null,
    workOrder: null,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Sale);

const mockWorkOrder = (overrides = {}): WorkOrder =>
  ({
    id: 1,
    codigo: 'OT-2025-001',
    estado: WorkOrderStatus.COMPLETED,
    ...overrides,
  } as WorkOrder);

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQB = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[mockSale()], 1]),
});

describe('SalesService', () => {
  let service: SalesService;
  let salesRepo: ReturnType<typeof mockRepo>;
  let workOrdersRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getRepositoryToken(Sale), useFactory: mockRepo },
        { provide: getRepositoryToken(WorkOrder), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    salesRepo = module.get(getRepositoryToken(Sale));
    workOrdersRepo = module.get(getRepositoryToken(WorkOrder));
  });

  describe('create', () => {
    it('creates sale without work order', async () => {
      const sale = mockSale();
      salesRepo.create.mockReturnValue(sale);
      salesRepo.save.mockResolvedValue(sale);

      const result = await service.create({ cliente: 'Corpoelec', producto: 'Transformador 500 KVA' }, 1);
      expect(result.cliente).toBe('Corpoelec');
      expect(workOrdersRepo.findOne).not.toHaveBeenCalled();
    });

    it('creates sale linked to COMPLETED work order', async () => {
      workOrdersRepo.findOne.mockResolvedValue(mockWorkOrder({ estado: WorkOrderStatus.COMPLETED }));
      const sale = mockSale({ workOrderId: 1 });
      salesRepo.create.mockReturnValue(sale);
      salesRepo.save.mockResolvedValue(sale);

      const result = await service.create(
        { cliente: 'Corpoelec', producto: 'Transformador 500 KVA', workOrderId: 1 },
        1,
      );
      expect(result.workOrderId).toBe(1);
    });

    it('throws BadRequestException when linking to non-completed work order', async () => {
      workOrdersRepo.findOne.mockResolvedValue(mockWorkOrder({ estado: WorkOrderStatus.IN_PROGRESS }));

      await expect(
        service.create({ cliente: 'Corpoelec', producto: 'Transformador', workOrderId: 1 }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for invalid workOrderId', async () => {
      workOrdersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ cliente: 'Corpoelec', producto: 'Transformador', workOrderId: 99 }, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns paginated results filtered by cliente', async () => {
      const qb = mockQB();
      salesRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 10, cliente: 'Corpoelec' });
      expect(result.data).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('cliente'), expect.objectContaining({ cliente: '%Corpoelec%' }),
      );
    });

    it('returns paginated results filtered by date range', async () => {
      const qb = mockQB();
      salesRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, fechaDesde: '2025-01-01', fechaHasta: '2025-12-31' });
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('fechaDesde'), expect.any(Object),
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('fechaHasta'), expect.any(Object),
      );
    });
  });

  describe('findOne', () => {
    it('returns sale when found', async () => {
      salesRepo.findOne.mockResolvedValue(mockSale());
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('throws NotFoundException when not found', async () => {
      salesRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });
});
