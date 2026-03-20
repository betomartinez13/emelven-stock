import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { Category } from '../src/modules/categories/entities/category.entity';
import { WorkOrder, WorkOrderStatus } from '../src/modules/work-orders/entities/work-order.entity';
import { WorkOrderMaterial } from '../src/modules/work-orders/entities/work-order-material.entity';
import { Sale } from '../src/modules/sales/entities/sale.entity';
import { InventoryEntry } from '../src/modules/inventory/entities/inventory-entry.entity';
import { InventoryExit } from '../src/modules/inventory/entities/inventory-exit.entity';
import { Material } from '../src/modules/materials/entities/material.entity';
import { Supplier } from '../src/modules/suppliers/entities/supplier.entity';
import { AuditLog } from '../src/modules/audit-log/entities/audit-log.entity';
import { DataSource, Repository } from 'typeorm';

describe('Sales (e2e)', () => {
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
  let saleRepo: Repository<Sale>;
  let auditRepo: Repository<AuditLog>;
  let adminToken: string;
  let completedWorkOrderId: number;
  let pendingWorkOrderId: number;

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
    saleRepo = moduleFixture.get<Repository<Sale>>(getRepositoryToken(Sale));
    auditRepo = moduleFixture.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    dataSource = moduleFixture.get(DataSource);

    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await auditRepo.createQueryBuilder().delete().execute();
    await saleRepo.createQueryBuilder().delete().execute();
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

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.access_token;

    // Seed a COMPLETED work order
    const completedWo = await workOrderRepo.save(workOrderRepo.create({
      codigo: 'OT-2025-001',
      descripcion: 'Transformador 500 KVA',
      cliente: 'Corpoelec',
      estado: WorkOrderStatus.COMPLETED,
      fechaInicio: new Date('2025-01-01'),
      fechaFin: new Date('2025-02-01'),
    }));
    completedWorkOrderId = completedWo.id;

    // Seed a PENDING work order
    const pendingWo = await workOrderRepo.save(workOrderRepo.create({
      codigo: 'OT-2025-002',
      descripcion: 'Transformador 250 KVA',
      cliente: 'Cliente B',
      estado: WorkOrderStatus.PENDING,
      fechaInicio: new Date('2025-01-01'),
    }));
    pendingWorkOrderId = pendingWo.id;
  });

  afterAll(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await auditRepo.createQueryBuilder().delete().execute();
    await saleRepo.createQueryBuilder().delete().execute();
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

  describe('POST /api/sales', () => {
    it('creates sale without work order', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cliente: 'Corpoelec Zulia', producto: 'Transformador 500 KVA', cantidad: 1 })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.cliente).toBe('Corpoelec Zulia');
      expect(res.body.workOrderId).toBeNull();
    });

    it('creates sale linked to COMPLETED work order', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cliente: 'Corpoelec Maracaibo',
          producto: 'Transformador 500 KVA',
          workOrderId: completedWorkOrderId,
        })
        .expect(201);

      expect(res.body.workOrderId).toBe(completedWorkOrderId);
    });

    it('returns 400 when linking to pending work order', async () => {
      await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cliente: 'Cliente Test',
          producto: 'Transformador',
          workOrderId: pendingWorkOrderId,
        })
        .expect(400);
    });

    it('returns 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/sales')
        .send({ cliente: 'Test', producto: 'Test' })
        .expect(401);
    });
  });

  describe('GET /api/sales', () => {
    it('returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('filters by cliente', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sales?cliente=Maracaibo')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.every((s: any) => s.cliente.includes('Maracaibo'))).toBe(true);
    });

    it('filters by date range', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sales?fechaDesde=2020-01-01&fechaHasta=2030-12-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/sales/:id', () => {
    it('returns sale by id', async () => {
      const sale = await saleRepo.findOne({ where: { cliente: 'Corpoelec Zulia' } });
      const res = await request(app.getHttpServer())
        .get(`/api/sales/${sale!.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.cliente).toBe('Corpoelec Zulia');
    });

    it('returns 404 for non-existent sale', async () => {
      await request(app.getHttpServer())
        .get('/api/sales/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
