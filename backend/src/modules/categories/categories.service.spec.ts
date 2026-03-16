import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { Material } from '../materials/entities/material.entity';

const mockCategory = (overrides = {}): Category =>
  ({ id: 1, nombre: 'Conductores', descripcion: 'Cables de cobre', createdAt: new Date(), updatedAt: new Date(), ...overrides } as Category);

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
});

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useFactory: mockRepo },
        { provide: getRepositoryToken(Material), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repo = module.get(getRepositoryToken(Category));
  });

  describe('findAll', () => {
    it('returns all categories sorted by nombre', async () => {
      const cats = [mockCategory({ nombre: 'Acero' }), mockCategory({ nombre: 'Conductores' })];
      repo.find.mockResolvedValue(cats);
      const result = await service.findAll();
      expect(result).toEqual(cats);
      expect(repo.find).toHaveBeenCalledWith({ order: { nombre: 'ASC' } });
    });
  });

  describe('findOne', () => {
    it('returns category when found', async () => {
      const cat = mockCategory();
      repo.findOne.mockResolvedValue(cat);
      const result = await service.findOne(1);
      expect(result).toEqual(cat);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns a category', async () => {
      const dto = { nombre: 'Aceite', descripcion: 'Aceite dieléctrico' };
      const cat = mockCategory(dto);
      repo.create.mockReturnValue(cat);
      repo.save.mockResolvedValue(cat);
      const result = await service.create(dto);
      expect(result).toEqual(cat);
      expect(repo.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('updates and returns the category', async () => {
      const cat = mockCategory();
      const dto = { nombre: 'Conductores Actualizado' };
      repo.findOne.mockResolvedValue(cat);
      repo.save.mockResolvedValue({ ...cat, ...dto });
      const result = await service.update(1, dto);
      expect(result.nombre).toBe('Conductores Actualizado');
    });

    it('throws NotFoundException if category does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update(99, { nombre: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes category and returns success message', async () => {
      const cat = mockCategory();
      repo.findOne.mockResolvedValue(cat);
      repo.delete.mockResolvedValue({ affected: 1 });
      const result = await service.remove(1);
      expect(result.message).toBeDefined();
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException if category does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
