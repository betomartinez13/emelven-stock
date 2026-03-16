import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { Category } from '../src/modules/categories/entities/category.entity';
import { Material } from '../src/modules/materials/entities/material.entity';
import { InventoryEntry } from '../src/modules/inventory/entities/inventory-entry.entity';
import { InventoryExit } from '../src/modules/inventory/entities/inventory-exit.entity';
import { AuditLog } from '../src/modules/audit-log/entities/audit-log.entity';
import { DataSource, Repository } from 'typeorm';

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let materialRepo: Repository<Material>;
  let entryRepo: Repository<InventoryEntry>;
  let exitRepo: Repository<InventoryExit>;
  let auditRepo: Repository<AuditLog>;
  let adminToken: string;
  let warehouseToken: string;
  let createdCategoryId: number;

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

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.access_token;

    const warehouseLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'warehouse@test.com', password: 'password123' });
    warehouseToken = warehouseLogin.body.access_token;
  });

  afterAll(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await auditRepo.createQueryBuilder().delete().execute();
    await exitRepo.createQueryBuilder().delete().execute();
    await entryRepo.createQueryBuilder().delete().execute();
    await materialRepo.createQueryBuilder().delete().execute();
    await categoryRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    await app.close();
  });

  describe('POST /api/categories', () => {
    it('admin can create a category', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Conductores', descripcion: 'Cables de cobre' })
        .expect(201);

      expect(res.body.nombre).toBe('Conductores');
      createdCategoryId = res.body.id;
    });

    it('warehouse cannot create a category (403)', () => {
      return request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ nombre: 'Acero' })
        .expect(403);
    });

    it('unauthenticated user cannot create a category (401)', () => {
      return request(app.getHttpServer())
        .post('/api/categories')
        .send({ nombre: 'Acero' })
        .expect(401);
    });
  });

  describe('GET /api/categories', () => {
    it('admin can list categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('warehouse can also list categories', () => {
      return request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(200);
    });
  });

  describe('PATCH /api/categories/:id', () => {
    it('admin can update a category', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Conductores Actualizado' })
        .expect(200);

      expect(res.body.nombre).toBe('Conductores Actualizado');
    });

    it('warehouse cannot update a category (403)', () => {
      return request(app.getHttpServer())
        .patch(`/api/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ nombre: 'Hack' })
        .expect(403);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('admin can delete a category', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBeDefined();
    });

    it('warehouse cannot delete a category (403)', async () => {
      const cat = await categoryRepo.save(categoryRepo.create({ nombre: 'Temp' }));
      await request(app.getHttpServer())
        .delete(`/api/categories/${cat.id}`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(403);
      await categoryRepo.delete(cat.id);
    });
  });
});
