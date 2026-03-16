import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { Supplier } from './entities/supplier.entity';
import { Material } from '../materials/entities/material.entity';

const mockSupplier = (overrides = {}): Supplier =>
  ({ id: 1, nombre: 'Proveedor A', contacto: 'Juan', telefono: '0412-0000000', email: 'a@test.com', direccion: 'Maracaibo', createdAt: new Date(), updatedAt: new Date(), ...overrides } as Supplier);

const mockRepo = () => ({
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
});

describe('SuppliersService', () => {
  let service: SuppliersService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        { provide: getRepositoryToken(Supplier), useFactory: mockRepo },
        { provide: getRepositoryToken(Material), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    repo = module.get(getRepositoryToken(Supplier));
  });

  describe('findAll', () => {
    it('returns paginated suppliers', async () => {
      const suppliers = [mockSupplier()];
      repo.findAndCount.mockResolvedValue([suppliers, 1]);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toEqual(suppliers);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('filters by search term', async () => {
      repo.findAndCount.mockResolvedValue([[mockSupplier()], 1]);
      await service.findAll({ page: 1, limit: 10, search: 'Proveedor' });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({}) }),
      );
    });
  });

  describe('findOne', () => {
    it('returns supplier when found', async () => {
      const supplier = mockSupplier();
      repo.findOne.mockResolvedValue(supplier);
      const result = await service.findOne(1);
      expect(result).toEqual(supplier);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns a supplier', async () => {
      const dto = { nombre: 'Nuevo Proveedor' };
      const supplier = mockSupplier(dto);
      repo.create.mockReturnValue(supplier);
      repo.save.mockResolvedValue(supplier);
      const result = await service.create(dto);
      expect(result).toEqual(supplier);
    });
  });

  describe('update', () => {
    it('updates and returns the supplier', async () => {
      const supplier = mockSupplier();
      const dto = { nombre: 'Proveedor Actualizado' };
      repo.findOne.mockResolvedValue(supplier);
      repo.save.mockResolvedValue({ ...supplier, ...dto });
      const result = await service.update(1, dto);
      expect(result.nombre).toBe('Proveedor Actualizado');
    });

    it('throws NotFoundException if supplier does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update(99, { nombre: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes supplier and returns success message', async () => {
      const supplier = mockSupplier();
      repo.findOne.mockResolvedValue(supplier);
      repo.delete.mockResolvedValue({ affected: 1 });
      const result = await service.remove(1);
      expect(result.message).toBeDefined();
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException if supplier does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
