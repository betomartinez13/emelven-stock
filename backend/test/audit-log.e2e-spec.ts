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

describe('Audit Log (e2e)', () => {
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
  let categoryId: number;
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
    categoryId = catInsert.identifiers[0].id;

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

  describe('Audit trail via Material operations', () => {
    it('POST /api/materials creates CREATE audit entry', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Cable de cobre', unidad: 'm', stockActual: 100, stockMin: 20, categoryId })
        .expect(201);

      materialId = res.body.id;

      // Small delay to allow async audit log to persist
      await new Promise((r) => setTimeout(r, 50));

      const auditRes = await request(app.getHttpServer())
        .get('/api/audit-log?entidad=Material&accion=CREATE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(auditRes.body.total).toBeGreaterThanOrEqual(1);
      expect(auditRes.body.data[0].accion).toBe('CREATE');
      expect(auditRes.body.data[0].entidad).toBe('Material');
    });

    it('PATCH /api/materials/:id creates UPDATE audit entry', async () => {
      await request(app.getHttpServer())
        .patch(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Cable actualizado' })
        .expect(200);

      await new Promise((r) => setTimeout(r, 50));

      const auditRes = await request(app.getHttpServer())
        .get('/api/audit-log?entidad=Material&accion=UPDATE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(auditRes.body.total).toBeGreaterThanOrEqual(1);
      expect(auditRes.body.data[0].accion).toBe('UPDATE');
    });

    it('DELETE /api/materials/:id creates DELETE audit entry', async () => {
      await request(app.getHttpServer())
        .delete(`/api/materials/${materialId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await new Promise((r) => setTimeout(r, 50));

      const auditRes = await request(app.getHttpServer())
        .get('/api/audit-log?entidad=Material&accion=DELETE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(auditRes.body.total).toBeGreaterThanOrEqual(1);
      expect(auditRes.body.data[0].accion).toBe('DELETE');
    });
  });

  describe('GET /api/audit-log', () => {
    it('returns 200 for admin', () => {
      return request(app.getHttpServer())
        .get('/api/audit-log')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('returns 403 for warehouse (non-admin)', () => {
      return request(app.getHttpServer())
        .get('/api/audit-log')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(403);
    });

    it('returns 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/audit-log')
        .expect(401);
    });

    it('filters by entidad=Material returns only material records', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/audit-log?entidad=Material')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.every((r: any) => r.entidad === 'Material')).toBe(true);
    });
  });
});
