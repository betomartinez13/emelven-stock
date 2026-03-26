import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { Category } from '../src/modules/categories/entities/category.entity';
import { Material } from '../src/modules/materials/entities/material.entity';
import { Supplier } from '../src/modules/suppliers/entities/supplier.entity';
import { WorkOrder, WorkOrderStatus } from '../src/modules/work-orders/entities/work-order.entity';
import { WorkOrderMaterial } from '../src/modules/work-orders/entities/work-order-material.entity';
import { InventoryEntry } from '../src/modules/inventory/entities/inventory-entry.entity';
import { InventoryExit } from '../src/modules/inventory/entities/inventory-exit.entity';
import { Sale } from '../src/modules/sales/entities/sale.entity';
import { AuditLog } from '../src/modules/audit-log/entities/audit-log.entity';
import { Alert } from '../src/modules/alerts/entities/alert.entity';
import { DataSource, Repository } from 'typeorm';

describe('Reports (e2e)', () => {
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
  let alertRepo: Repository<Alert>;
  let adminToken: string;
  let managerToken: string;
  let warehouseToken: string;
  let workOrderId: number;
  const testYear = 2023; // Fixed year for deterministic tests

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
    alertRepo = moduleFixture.get<Repository<Alert>>(getRepositoryToken(Alert));
    dataSource = moduleFixture.get(DataSource);

    // Clean slate
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await auditRepo.createQueryBuilder().delete().execute();
    await alertRepo.createQueryBuilder().delete().execute();
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

    // Seed 3 users
    await userRepo.insert([
      { nombre: 'Admin', apellido: 'Test', email: 'admin@test.com', password: hashedPassword, role: UserRole.ADMIN, isActive: true },
      { nombre: 'Manager', apellido: 'Test', email: 'manager@test.com', password: hashedPassword, role: UserRole.MANAGER, isActive: true },
      { nombre: 'Warehouse', apellido: 'Test', email: 'warehouse@test.com', password: hashedPassword, role: UserRole.WAREHOUSE, isActive: true },
    ]);

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.access_token;

    const managerLogin = await request(app.getHttpServer())
      .post('/api/auth/login').send({ email: 'manager@test.com', password: 'password123' });
    managerToken = managerLogin.body.access_token;

    const warehouseLogin = await request(app.getHttpServer())
      .post('/api/auth/login').send({ email: 'warehouse@test.com', password: 'password123' });
    warehouseToken = warehouseLogin.body.access_token;

    const adminUser = await userRepo.findOne({ where: { email: 'admin@test.com' } });

    // Seed category + materials
    const category = await categoryRepo.save(categoryRepo.create({ nombre: 'Conductores', descripcion: 'Cables' }));
    const mat1 = await materialRepo.save(materialRepo.create({
      nombre: 'Cable de cobre', unidad: 'm', stockActual: 500, stockMin: 50, stockMax: 1000, categoryId: category.id,
    }));
    const mat2 = await materialRepo.save(materialRepo.create({
      nombre: 'Aceite dieléctrico', unidad: 'L', stockActual: 200, stockMin: 20, stockMax: 500, categoryId: category.id,
    }));

    // Seed inventory exits in testYear (2023)
    await exitRepo.insert([
      { materialId: mat1.id, cantidad: 100, fechaSalida: new Date(`${testYear}-01-15T10:00:00`), userId: adminUser!.id },
      { materialId: mat1.id, cantidad: 80, fechaSalida: new Date(`${testYear}-03-20T10:00:00`), userId: adminUser!.id },
      { materialId: mat2.id, cantidad: 30, fechaSalida: new Date(`${testYear}-01-10T10:00:00`), userId: adminUser!.id },
    ]);

    // Seed entries
    await entryRepo.insert([
      { materialId: mat1.id, cantidad: 200, fechaEntrada: new Date(`${testYear}-01-05T10:00:00`), userId: adminUser!.id },
    ]);

    // Seed a completed work order with materials consumed
    const wo = await workOrderRepo.save(workOrderRepo.create({
      codigo: 'OT-2023-001',
      descripcion: 'Transformador 500 KVA',
      cliente: 'Corpoelec',
      estado: WorkOrderStatus.COMPLETED,
      fechaInicio: new Date(`${testYear}-01-01`),
      fechaFin: new Date(`${testYear}-02-01`),
    }));
    workOrderId = wo.id;

    await workOrderMaterialRepo.insert([
      { workOrderId: wo.id, materialId: mat1.id, cantidadUsada: 50, fecha: new Date(`${testYear}-01-20T10:00:00`) },
      { workOrderId: wo.id, materialId: mat2.id, cantidadUsada: 10, fecha: new Date(`${testYear}-01-21T10:00:00`) },
    ]);
  });

  afterAll(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await auditRepo.createQueryBuilder().delete().execute();
    await alertRepo.createQueryBuilder().delete().execute();
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

  describe('GET /api/reports/monthly-consumption', () => {
    it('returns structured monthly data matching seeded exits', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/monthly-consumption?year=${testYear}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.year).toBe(testYear);
      expect(res.body.labels).toHaveLength(12);
      expect(res.body.items).toBeDefined();
      expect(res.body.items.length).toBeGreaterThanOrEqual(2);

      const cable = res.body.items.find((i: any) => i.nombre === 'Cable de cobre');
      expect(cable).toBeDefined();
      expect(cable.consumoPorMes[0].cantidad).toBe(100); // January
      expect(cable.consumoPorMes[2].cantidad).toBe(80);  // March
      expect(cable.consumoPorMes[1].cantidad).toBe(0);   // February = 0
    });

    it('returns empty items for year with no exits', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/monthly-consumption?year=1999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.items).toHaveLength(0);
    });

    it('returns 400 when year is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/monthly-consumption')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /api/reports/project-consumption/:workOrderId', () => {
    it('returns correct material consumption for work order', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/project-consumption/${workOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.workOrder.codigo).toBe('OT-2023-001');
      expect(res.body.materials).toHaveLength(2);
      expect(res.body.totalMovimientos).toBe(2);

      const cable = res.body.materials.find((m: any) => m.nombre === 'Cable de cobre');
      expect(cable).toBeDefined();
      expect(cable.cantidadUsada).toBe(50);
      expect(cable.porcentaje).toBeGreaterThan(0);

      // Percentages should sum to 100
      const sum = res.body.materials.reduce((s: number, m: any) => s + m.porcentaje, 0);
      expect(sum).toBe(100);
    });

    it('returns 404 for non-existent work order', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/project-consumption/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /api/reports/kpi', () => {
    it('returns all required KPI fields with correct types', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/kpi')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(typeof res.body.totalMateriales).toBe('number');
      expect(typeof res.body.materialesConStockBajo).toBe('number');
      expect(typeof res.body.materialesSinStock).toBe('number');
      expect(typeof res.body.entradasDelMes).toBe('number');
      expect(typeof res.body.salidasDelMes).toBe('number');
      expect(typeof res.body.ordenesActivas).toBe('number');
      expect(typeof res.body.ordenesCompletadasMes).toBe('number');
      expect(typeof res.body.ventasMes).toBe('number');
      expect(res.body.totalMateriales).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Role-based access control', () => {
    it('warehouse role gets 403 on monthly-consumption', async () => {
      await request(app.getHttpServer())
        .get(`/api/reports/monthly-consumption?year=${testYear}`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(403);
    });

    it('warehouse role gets 403 on kpi', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/kpi')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(403);
    });

    it('manager role gets 200 on monthly-consumption', async () => {
      await request(app.getHttpServer())
        .get(`/api/reports/monthly-consumption?year=${testYear}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });

    it('manager role gets 200 on kpi', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/kpi')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });
  });

  describe('PDF Export endpoints', () => {
    it('GET /api/reports/export/pdf/monthly returns application/pdf', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/export/pdf/monthly?year=${testYear}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.body).toBeDefined();
    }, 15000);

    it('GET /api/reports/export/pdf/project/:id returns application/pdf', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/export/pdf/project/${workOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
    }, 15000);

    it('GET /api/reports/export/pdf/inventory returns application/pdf', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/reports/export/pdf/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
    }, 15000);

    it('warehouse role gets 403 on PDF endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/export/pdf/inventory')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(403);
    });
  });
});
