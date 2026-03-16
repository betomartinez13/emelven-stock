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
import { InventoryEntry } from '../src/modules/inventory/entities/inventory-entry.entity';
import { InventoryExit } from '../src/modules/inventory/entities/inventory-exit.entity';
import { AuditLog } from '../src/modules/audit-log/entities/audit-log.entity';
import { DataSource, Repository } from 'typeorm';

describe('Inventory (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let supplierRepo: Repository<Supplier>;
  let materialRepo: Repository<Material>;
  let entryRepo: Repository<InventoryEntry>;
  let exitRepo: Repository<InventoryExit>;
  let auditRepo: Repository<AuditLog>;
  let adminToken: string;
  let warehouseToken: string;
  let materialId: number;

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
    entryRepo = moduleFixture.get<Repository<InventoryEntry>>(getRepositoryToken(InventoryEntry));
    exitRepo = moduleFixture.get<Repository<InventoryExit>>(getRepositoryToken(InventoryExit));
    auditRepo = moduleFixture.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    dataSource = moduleFixture.get(DataSource);

    // FK-safe cleanup (FK checks disabled to handle async audit saves race condition)
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await auditRepo.createQueryBuilder().delete().execute();
    await exitRepo.createQueryBuilder().delete().execute();
    await entryRepo.createQueryBuilder().delete().execute();
    await materialRepo.createQueryBuilder().delete().execute();
    await supplierRepo.createQueryBuilder().delete().execute();
    await categoryRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

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
    const categoryId = catInsert.identifiers[0].id;

    const matInsert = await materialRepo.insert({
      nombre: 'Cable de cobre',
      unidad: 'm',
      stockActual: 100,
      stockMin: 20,
      stockMax: 500,
      categoryId,
    });
    materialId = matInsert.identifiers[0].id;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.access_token;

    const warehouseLogin = await request(app.getHttpServer())
      .post('/api/auth/login').send({ email: 'warehouse@test.com', password: 'password123' });
    warehouseToken = warehouseLogin.body.access_token;
  });

  afterAll(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await auditRepo.createQueryBuilder().delete().execute();
    await exitRepo.createQueryBuilder().delete().execute();
    await entryRepo.createQueryBuilder().delete().execute();
    await materialRepo.createQueryBuilder().delete().execute();
    await supplierRepo.createQueryBuilder().delete().execute();
    await categoryRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    await app.close();
  });

  describe('POST /api/inventory/entries', () => {
    it('admin can create entry — stock increases', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/inventory/entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ materialId, cantidad: 50 })
        .expect(201);

      expect(res.body.materialId).toBe(materialId);
      expect(res.body.cantidad).toBe(50);

      // Verify stock increased
      const matRes = await request(app.getHttpServer())
        .get(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(matRes.body.stockActual).toBe(150);
    });

    it('warehouse can create entry', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/inventory/entries')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ materialId, cantidad: 10, observacion: 'Reposición' })
        .expect(201);

      expect(res.body.cantidad).toBe(10);
    });

    it('returns 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/inventory/entries')
        .send({ materialId, cantidad: 10 })
        .expect(401);
    });

    it('returns 404 for invalid materialId', () => {
      return request(app.getHttpServer())
        .post('/api/inventory/entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ materialId: 9999, cantidad: 10 })
        .expect(404);
    });
  });

  describe('POST /api/inventory/exits', () => {
    it('admin can create exit — stock decreases', async () => {
      // Check current stock first
      const matBefore = await request(app.getHttpServer())
        .get(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const stockBefore = matBefore.body.stockActual;

      const res = await request(app.getHttpServer())
        .post('/api/inventory/exits')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ materialId, cantidad: 30, motivo: 'Consumo producción' })
        .expect(201);

      expect(res.body.materialId).toBe(materialId);
      expect(res.body.cantidad).toBe(30);

      const matAfter = await request(app.getHttpServer())
        .get(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(matAfter.body.stockActual).toBe(stockBefore - 30);
    });

    it('returns 400 when cantidad > stockActual', async () => {
      // First exit all remaining stock
      const matRes = await request(app.getHttpServer())
        .get(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const currentStock = matRes.body.stockActual;

      const res = await request(app.getHttpServer())
        .post('/api/inventory/exits')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ materialId, cantidad: currentStock + 100 })
        .expect(400);

      expect(res.body.message).toContain('Stock insuficiente');
    });

    it('returns 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/inventory/exits')
        .send({ materialId, cantidad: 10 })
        .expect(401);
    });
  });

  describe('GET /api/inventory/entries', () => {
    it('returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventory/entries')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('filters by materialId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/inventory/entries?materialId=${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.every((e: any) => e.materialId === materialId)).toBe(true);
    });

    it('pagination works', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventory/entries?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.limit).toBe(1);
    });
  });

  describe('GET /api/inventory/exits', () => {
    it('returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventory/exits')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/inventory/movements/:materialId', () => {
    it('returns combined entries and exits sorted by date', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/inventory/movements/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      // Each item has type 'entry' or 'exit'
      res.body.forEach((item: any) => {
        expect(['entry', 'exit']).toContain(item.type);
        expect(item.cantidad).toBeDefined();
        expect(item.date).toBeDefined();
      });

      // Verify sorted descending
      for (let i = 1; i < res.body.length; i++) {
        const prev = new Date(res.body[i - 1].date).getTime();
        const curr = new Date(res.body[i].date).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it('returns 404 for invalid materialId', () => {
      return request(app.getHttpServer())
        .get('/api/inventory/movements/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
