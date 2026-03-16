import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { Category } from '../src/modules/categories/entities/category.entity';
import { Supplier } from '../src/modules/suppliers/entities/supplier.entity';
import { Material } from '../src/modules/materials/entities/material.entity';
import { Repository } from 'typeorm';

describe('Materials (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let supplierRepo: Repository<Supplier>;
  let materialRepo: Repository<Material>;
  let adminToken: string;
  let warehouseToken: string;
  let categoryId: number;
  let supplierId: number;
  let createdMaterialId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    categoryRepo = moduleFixture.get<Repository<Category>>(getRepositoryToken(Category));
    supplierRepo = moduleFixture.get<Repository<Supplier>>(getRepositoryToken(Supplier));
    materialRepo = moduleFixture.get<Repository<Material>>(getRepositoryToken(Material));

    // Delete in FK-safe order: children before parents
    await materialRepo.createQueryBuilder().delete().execute();
    await supplierRepo.createQueryBuilder().delete().execute();
    await categoryRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();

    const hashedPassword = await bcrypt.hash('password123', 10);

    await userRepo.insert({
      nombre: 'Admin', apellido: 'Test', email: 'admin@test.com',
      password: hashedPassword, role: UserRole.ADMIN, isActive: true,
    });
    await userRepo.insert({
      nombre: 'Warehouse', apellido: 'Test', email: 'warehouse@test.com',
      password: hashedPassword, role: UserRole.WAREHOUSE, isActive: true,
    });

    const catInsert = await categoryRepo.insert({ nombre: 'Conductores', descripcion: 'Test' });
    categoryId = catInsert.identifiers[0].id;

    const supInsert = await supplierRepo.insert({ nombre: 'Proveedor Test' });
    supplierId = supInsert.identifiers[0].id;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.access_token;

    const warehouseLogin = await request(app.getHttpServer())
      .post('/api/auth/login').send({ email: 'warehouse@test.com', password: 'password123' });
    warehouseToken = warehouseLogin.body.access_token;
  });

  afterAll(async () => {
    await materialRepo.createQueryBuilder().delete().execute();
    await supplierRepo.createQueryBuilder().delete().execute();
    await categoryRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();
    await app.close();
  });

  describe('POST /api/materials', () => {
    it('admin can create a material', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Cable de cobre', unidad: 'm', stockActual: 500, stockMin: 100, stockMax: 1000, categoryId })
        .expect(201);

      expect(res.body.nombre).toBe('Cable de cobre');
      expect(res.body.categoryId).toBe(categoryId);
      createdMaterialId = res.body.id;
    });

    it('warehouse can create a material', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/materials')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ nombre: 'Tornillos M8', unidad: 'unidad', stockActual: 200, stockMin: 50, categoryId })
        .expect(201);

      expect(res.body.nombre).toBe('Tornillos M8');
      await materialRepo.delete(res.body.id);
    });

    it('returns 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/materials')
        .send({ nombre: 'Hack', unidad: 'm', categoryId })
        .expect(401);
    });

    it('returns 404 for invalid categoryId', () => {
      return request(app.getHttpServer())
        .post('/api/materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Test Material', unidad: 'm', categoryId: 9999 })
        .expect(404);
    });
  });

  describe('GET /api/materials', () => {
    it('returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('filters by categoryId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/materials?categoryId=${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.every((m: any) => m.categoryId === categoryId)).toBe(true);
    });

    it('pagination works', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/materials?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.limit).toBe(1);
    });
  });

  describe('GET /api/materials/low-stock', () => {
    it('returns materials below stockMin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/materials/low-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/materials/:id', () => {
    it('returns material by ID with category relation', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/materials/${createdMaterialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdMaterialId);
      expect(res.body.category).toBeDefined();
    });
  });

  describe('PATCH /api/materials/:id', () => {
    it('admin can update a material', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/materials/${createdMaterialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Cable actualizado' })
        .expect(200);

      expect(res.body.nombre).toBe('Cable actualizado');
    });

    it('warehouse can update a material', () => {
      return request(app.getHttpServer())
        .patch(`/api/materials/${createdMaterialId}`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ stockMin: 150 })
        .expect(200);
    });
  });

  describe('DELETE /api/materials/:id — ConflictException check on category', () => {
    it('cannot delete category that has linked materials (409)', () => {
      return request(app.getHttpServer())
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);
    });
  });

  describe('DELETE /api/materials/:id', () => {
    it('warehouse cannot delete a material (403)', () => {
      return request(app.getHttpServer())
        .delete(`/api/materials/${createdMaterialId}`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(403);
    });

    it('admin can delete a material', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/materials/${createdMaterialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBeDefined();
    });
  });
});
