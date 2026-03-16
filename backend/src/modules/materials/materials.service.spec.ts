import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { Material } from './entities/material.entity';
import { Category } from '../categories/entities/category.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { InventoryEntry } from '../inventory/entities/inventory-entry.entity';
import { InventoryExit } from '../inventory/entities/inventory-exit.entity';

const mockMaterial = (overrides = {}): Material =>
  ({
    id: 1, nombre: 'Cable de cobre', descripcion: null, unidad: 'm',
    stockActual: 500, stockMin: 100, stockMax: 1000,
    categoryId: 1, supplierId: null,
    category: { id: 1, nombre: 'Conductores' } as Category,
    supplier: null,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as Material);

const mockQB = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[mockMaterial()], 1]),
  getMany: jest.fn().mockResolvedValue([mockMaterial({ stockActual: 50, stockMin: 100 })]),
});

const mockRepo = () => ({
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
});

describe('MaterialsService', () => {
  let service: MaterialsService;
  let materialsRepo: ReturnType<typeof mockRepo>;
  let categoriesRepo: ReturnType<typeof mockRepo>;
  let suppliersRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        { provide: getRepositoryToken(Material), useFactory: mockRepo },
        { provide: getRepositoryToken(Category), useFactory: mockRepo },
        { provide: getRepositoryToken(Supplier), useFactory: mockRepo },
        { provide: getRepositoryToken(InventoryEntry), useFactory: mockRepo },
        { provide: getRepositoryToken(InventoryExit), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
    materialsRepo = module.get(getRepositoryToken(Material));
    categoriesRepo = module.get(getRepositoryToken(Category));
    suppliersRepo = module.get(getRepositoryToken(Supplier));
  });

  describe('findAll', () => {
    it('returns paginated results', async () => {
      const qb = mockQB();
      materialsRepo.createQueryBuilder.mockReturnValue(qb);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('applies search filter', async () => {
      const qb = mockQB();
      materialsRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({ page: 1, limit: 10, search: 'cable' });
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'), expect.objectContaining({ search: '%cable%' }),
      );
    });

    it('applies categoryId filter', async () => {
      const qb = mockQB();
      materialsRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({ page: 1, limit: 10, categoryId: 1 });
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('categoryId'), expect.objectContaining({ categoryId: 1 }),
      );
    });

    it('applies supplierId filter', async () => {
      const qb = mockQB();
      materialsRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({ page: 1, limit: 10, supplierId: 2 });
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('supplierId'), expect.objectContaining({ supplierId: 2 }),
      );
    });
  });

  describe('findLowStock', () => {
    it('returns materials below stockMin', async () => {
      const qb = mockQB();
      materialsRepo.createQueryBuilder.mockReturnValue(qb);
      const result = await service.findLowStock();
      expect(result[0].stockActual).toBeLessThan(result[0].stockMin);
    });
  });

  describe('findOne', () => {
    it('returns material when found', async () => {
      materialsRepo.findOne.mockResolvedValue(mockMaterial());
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('throws NotFoundException when not found', async () => {
      materialsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates material with valid categoryId', async () => {
      const dto = { nombre: 'Cable', unidad: 'm', categoryId: 1 };
      const mat = mockMaterial(dto);
      categoriesRepo.findOne.mockResolvedValue({ id: 1, nombre: 'Conductores' });
      materialsRepo.create.mockReturnValue(mat);
      materialsRepo.save.mockResolvedValue(mat);
      const result = await service.create(dto as any);
      expect(result.nombre).toBe('Cable');
    });

    it('throws NotFoundException for invalid categoryId', async () => {
      categoriesRepo.findOne.mockResolvedValue(null);
      await expect(service.create({ nombre: 'X', unidad: 'm', categoryId: 99 } as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates material fields', async () => {
      const mat = mockMaterial();
      materialsRepo.findOne.mockResolvedValue(mat);
      materialsRepo.save.mockResolvedValue({ ...mat, nombre: 'Actualizado' });
      const result = await service.update(1, { nombre: 'Actualizado' });
      expect(result.nombre).toBe('Actualizado');
    });

    it('throws BadRequestException if stockMax < stockActual', async () => {
      const mat = mockMaterial({ stockActual: 500 });
      materialsRepo.findOne.mockResolvedValue(mat);
      await expect(service.update(1, { stockMax: 100 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deletes material and returns success message', async () => {
      materialsRepo.findOne.mockResolvedValue(mockMaterial());
      materialsRepo.delete.mockResolvedValue({ affected: 1 });
      const result = await service.remove(1);
      expect(result.message).toBeDefined();
    });

    it('throws NotFoundException if material does not exist', async () => {
      materialsRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
