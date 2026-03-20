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
import { WorkOrder } from '../src/modules/work-orders/entities/work-order.entity';
import { WorkOrderMaterial } from '../src/modules/work-orders/entities/work-order-material.entity';
import { AuditLog } from '../src/modules/audit-log/entities/audit-log.entity';
import { DataSource, Repository } from 'typeorm';

describe('Work Orders (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let supplierRepo: Repository<Supplier>;
  let materialRepo: Repository<Material>;
  let entryRepo: Repository<InventoryEntry>;
  let exitRepo: Repository<InventoryExit>;
  let workOrderRepo: Repository<WorkOrder>;
  let workOrderMaterialRepo: Repository<WorkOrderMaterial>;
  let auditRepo: Repository<AuditLog>;
  let adminToken: string;
  let warehouseToken: string;
  let materialId: number;
  let workOrderId: number;

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
    workOrderRepo = moduleFixture.get<Repository<WorkOrder>>(getRepositoryToken(WorkOrder));
    workOrderMaterialRepo = moduleFixture.get<Repository<WorkOrderMaterial>>(getRepositoryToken(WorkOrderMaterial));
    auditRepo = moduleFixture.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    dataSource = moduleFixture.get(DataSource);

    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await auditRepo.createQueryBuilder().delete().execute();
    await workOrderMaterialRepo.createQueryBuilder().delete().execute();
    await workOrderRepo.createQueryBuilder().delete().execute();
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
      nombre: 'Cable de cobre', unidad: 'm',
      stockActual: 200, stockMin: 20, stockMax: 500, categoryId,
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
    await workOrderMaterialRepo.createQueryBuilder().delete().execute();
    await workOrderRepo.createQueryBuilder().delete().execute();
    await exitRepo.createQueryBuilder().delete().execute();
    await entryRepo.createQueryBuilder().delete().execute();
    await materialRepo.createQueryBuilder().delete().execute();
    await supplierRepo.createQueryBuilder().delete().execute();
    await categoryRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    await app.close();
  });

  describe('POST /api/work-orders', () => {
    it('admin can create a work order with auto-generated code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          descripcion: 'Ensamblaje transformador 500 KVA',
          cliente: 'Corpoelec Zulia',
          fechaInicio: '2025-03-01',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.codigo).toMatch(/^OT-\d{4}-\d{3}$/);
      expect(res.body.estado).toBe('pendiente');
      workOrderId = res.body.id;
    });

    it('warehouse can create a work order', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({
          descripcion: 'Transformador 250 KVA',
          cliente: 'Cliente B',
          fechaInicio: '2025-03-02',
        })
        .expect(201);

      expect(res.body.codigo).toMatch(/^OT-\d{4}-\d{3}$/);
    });

    it('returns 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/work-orders')
        .send({ descripcion: 'Test', cliente: 'Test', fechaInicio: '2025-01-01' })
        .expect(401);
    });
  });

  describe('GET /api/work-orders', () => {
    it('returns paginated list (all roles)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/work-orders')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('filters by estado=pendiente', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/work-orders?estado=pendiente')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.every((wo: any) => wo.estado === 'pendiente')).toBe(true);
    });
  });

  describe('Status transitions', () => {
    it('pendiente → en_progreso is allowed', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/work-orders/${workOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'en_progreso' })
        .expect(200);

      expect(res.body.estado).toBe('en_progreso');
    });

    it('invalid transition en_progreso → pendiente returns 400', async () => {
      await request(app.getHttpServer())
        .patch(`/api/work-orders/${workOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'pendiente' })
        .expect(400);
    });
  });

  describe('POST /api/work-orders/:id/materials', () => {
    it('add material decreases stock and creates inventory exit', async () => {
      const stockBefore = (await materialRepo.findOne({ where: { id: materialId } }))!.stockActual;

      await request(app.getHttpServer())
        .post(`/api/work-orders/${workOrderId}/materials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ materialId, cantidadUsada: 50 })
        .expect(201);

      const stockAfter = (await materialRepo.findOne({ where: { id: materialId } }))!.stockActual;
      expect(Number(stockAfter)).toBe(Number(stockBefore) - 50);

      const exit = await exitRepo.findOne({ where: { workOrderId } });
      expect(exit).toBeDefined();
      expect(Number(exit!.cantidad)).toBe(50);
    });

    it('returns 400 when adding material to completed work order', async () => {
      // Complete the work order first
      await request(app.getHttpServer())
        .patch(`/api/work-orders/${workOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'completada' })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/work-orders/${workOrderId}/materials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ materialId, cantidadUsada: 10 })
        .expect(400);
    });

    it('returns 400 when stock is insufficient', async () => {
      // Create a new work order and start it
      const newWo = await request(app.getHttpServer())
        .post('/api/work-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ descripcion: 'OT para test stock', cliente: 'Test', fechaInicio: '2025-03-01' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/work-orders/${newWo.body.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'en_progreso' });

      await request(app.getHttpServer())
        .post(`/api/work-orders/${newWo.body.id}/materials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ materialId, cantidadUsada: 99999 })
        .expect(400);
    });
  });

  describe('GET /api/work-orders/:id/materials', () => {
    it('returns consumed materials list', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/work-orders/${workOrderId}/materials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].materialId).toBe(materialId);
    });
  });

  describe('GET /api/work-orders/:id', () => {
    it('returns work order detail with materials', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/work-orders/${workOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.codigo).toBeDefined();
      expect(res.body.materials).toBeDefined();
      expect(res.body.estado).toBe('completada');
    });
  });
});
