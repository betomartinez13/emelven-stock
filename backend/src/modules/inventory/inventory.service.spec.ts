import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryService } from './inventory.service';
import { InventoryEntry } from './entities/inventory-entry.entity';
import { InventoryExit } from './entities/inventory-exit.entity';
import { Material } from '../materials/entities/material.entity';
import { AlertsService } from '../alerts/alerts.service';

const mockMaterial = (overrides = {}) =>
  ({
    id: 1,
    nombre: 'Cable de cobre',
    unidad: 'm',
    stockActual: 100,
    stockMin: 20,
    stockMax: 500,
    categoryId: 1,
    ...overrides,
  } as Material);

const mockEntry = (overrides = {}) =>
  ({
    id: 1,
    materialId: 1,
    cantidad: 50,
    fechaEntrada: new Date('2026-01-10T10:00:00Z'),
    userId: 1,
    user: { nombre: 'Test', apellido: 'User' },
    ...overrides,
  } as InventoryEntry);

const mockExit = (overrides = {}) =>
  ({
    id: 1,
    materialId: 1,
    cantidad: 30,
    fechaSalida: new Date('2026-01-11T10:00:00Z'),
    userId: 1,
    user: { nombre: 'Test', apellido: 'User' },
    ...overrides,
  } as InventoryExit);

const mockQB = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[mockEntry()], 1]),
  getMany: jest.fn().mockResolvedValue([mockEntry()]),
});

const mockRepo = () => ({
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
});

describe('InventoryService', () => {
  let service: InventoryService;
  let entriesRepo: ReturnType<typeof mockRepo>;
  let exitsRepo: ReturnType<typeof mockRepo>;
  let materialsRepo: ReturnType<typeof mockRepo>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(InventoryEntry), useFactory: mockRepo },
        { provide: getRepositoryToken(InventoryExit), useFactory: mockRepo },
        { provide: getRepositoryToken(Material), useFactory: mockRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: AlertsService, useValue: { checkAndCreateAlert: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    entriesRepo = module.get(getRepositoryToken(InventoryEntry));
    exitsRepo = module.get(getRepositoryToken(InventoryExit));
    materialsRepo = module.get(getRepositoryToken(Material));
  });

  describe('createEntry', () => {
    it('increases stockActual by cantidad', async () => {
      const mat = mockMaterial({ stockActual: 100 });
      const entry = mockEntry({ cantidad: 50 });

      const manager = {
        findOne: jest.fn().mockResolvedValue(mat),
        create: jest.fn().mockReturnValue(entry),
        save: jest.fn().mockResolvedValue(entry),
        update: jest.fn().mockResolvedValue(undefined),
      };
      dataSource.transaction.mockImplementation((cb: (manager: typeof manager) => Promise<InventoryEntry>) => cb(manager));

      const result = await service.createEntry({ materialId: 1, cantidad: 50 }, 1);

      expect(manager.update).toHaveBeenCalledWith(Material, mat.id, { stockActual: 150 });
      expect(result).toBe(entry);
    });

    it('throws NotFoundException for invalid materialId', async () => {
      const manager = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
      };
      dataSource.transaction.mockImplementation((cb: (manager: typeof manager) => Promise<InventoryEntry>) => cb(manager));

      await expect(service.createEntry({ materialId: 999, cantidad: 10 }, 1)).rejects.toThrow(NotFoundException);
    });

    it('uses current date when fechaEntrada not provided', async () => {
      const mat = mockMaterial();
      const entry = mockEntry();
      const manager = {
        findOne: jest.fn().mockResolvedValue(mat),
        create: jest.fn().mockReturnValue(entry),
        save: jest.fn().mockResolvedValue(entry),
        update: jest.fn().mockResolvedValue(undefined),
      };
      dataSource.transaction.mockImplementation((cb: (manager: typeof manager) => Promise<InventoryEntry>) => cb(manager));

      await service.createEntry({ materialId: 1, cantidad: 10 }, 1);

      const createCall = manager.create.mock.calls[0][1];
      expect(createCall.fechaEntrada).toBeInstanceOf(Date);
    });
  });

  describe('createExit', () => {
    it('decreases stockActual by cantidad', async () => {
      const mat = mockMaterial({ stockActual: 100 });
      const exit = mockExit({ cantidad: 30 });

      const manager = {
        findOne: jest.fn().mockResolvedValue(mat),
        create: jest.fn().mockReturnValue(exit),
        save: jest.fn().mockResolvedValue(exit),
        update: jest.fn().mockResolvedValue(undefined),
      };
      dataSource.transaction.mockImplementation((cb: (manager: typeof manager) => Promise<InventoryExit>) => cb(manager));
      materialsRepo.findOne.mockResolvedValue(mockMaterial({ stockActual: 70 }));

      const result = await service.createExit({ materialId: 1, cantidad: 30 }, 1);

      expect(manager.update).toHaveBeenCalledWith(Material, mat.id, { stockActual: 70 });
      expect(result).toBe(exit);
    });

    it('throws BadRequestException when cantidad > stockActual', async () => {
      const mat = mockMaterial({ stockActual: 10 });
      const manager = {
        findOne: jest.fn().mockResolvedValue(mat),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
      };
      dataSource.transaction.mockImplementation((cb: (manager: typeof manager) => Promise<InventoryExit>) => cb(manager));

      await expect(service.createExit({ materialId: 1, cantidad: 50 }, 1)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for invalid materialId', async () => {
      const manager = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
      };
      dataSource.transaction.mockImplementation((cb: (manager: typeof manager) => Promise<InventoryExit>) => cb(manager));
      materialsRepo.findOne.mockResolvedValue(null);

      await expect(service.createExit({ materialId: 999, cantidad: 10 }, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllEntries', () => {
    it('returns paginated results', async () => {
      const qb = mockQB();
      entriesRepo.createQueryBuilder.mockReturnValue(qb);
      const result = await service.findAllEntries({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('applies materialId filter', async () => {
      const qb = mockQB();
      entriesRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findAllEntries({ page: 1, limit: 10, materialId: 1 });
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('materialId'),
        expect.objectContaining({ materialId: 1 }),
      );
    });
  });

  describe('findAllExits', () => {
    it('returns paginated results', async () => {
      const qb = {
        ...mockQB(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockExit()], 1]),
      };
      exitsRepo.createQueryBuilder.mockReturnValue(qb);
      const result = await service.findAllExits({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getMovements', () => {
    it('returns combined entries and exits sorted by date descending', async () => {
      materialsRepo.findOne.mockResolvedValue(mockMaterial());
      entriesRepo.find.mockResolvedValue([
        mockEntry({ fechaEntrada: new Date('2026-01-10T10:00:00Z') }),
      ]);
      exitsRepo.find.mockResolvedValue([
        mockExit({ fechaSalida: new Date('2026-01-12T10:00:00Z') }),
      ]);

      const result = await service.getMovements(1);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('exit');   // More recent
      expect(result[1].type).toBe('entry');
      expect(new Date(result[0].fecha).getTime()).toBeGreaterThan(new Date(result[1].fecha).getTime());
    });

    it('throws NotFoundException for invalid materialId', async () => {
      materialsRepo.findOne.mockResolvedValue(null);
      await expect(service.getMovements(999)).rejects.toThrow(NotFoundException);
    });
  });
});
