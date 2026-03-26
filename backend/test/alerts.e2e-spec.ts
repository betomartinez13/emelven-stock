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
import { Sale } from '../src/modules/sales/entities/sale.entity';
import { Alert } from '../src/modules/alerts/entities/alert.entity';
import { AuditLog } from '../src/modules/audit-log/entities/audit-log.entity';
import { DataSource, Repository } from 'typeorm';

describe('Alerts (e2e)', () => {
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
  let alertRepo: Repository<Alert>;
  let auditRepo: Repository<AuditLog>;
  let adminToken: string;
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
    workOrderRepo = moduleFixture.get<Repository<WorkOrder>>(getRepositoryToken(WorkOrder));
    workOrderMaterialRepo = moduleFixture.get<Repository<WorkOrderMaterial>>(getRepositoryToken(WorkOrderMaterial));
    saleRepo = moduleFixture.get<Repository<Sale>>(getRepositoryToken(Sale));
    alertRepo = moduleFixture.get<Repository<Alert>>(getRepositoryToken(Alert));
    auditRepo = moduleFixture.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    dataSource = moduleFixture.get(DataSource);

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
    await userRepo.insert({
      nombre: 'Admin', apellido: 'Test', email: 'admin@test.com',
      password: hashedPassword, role: UserRole.ADMIN, isActive: true,
    });

    const catInsert = await categoryRepo.insert({ nombre: 'Conductores', descripcion: 'Test' });
    const categoryId = catInsert.identifiers[0].id;

    // Material with stockMin=10, stockActual=15
    const matInsert = await materialRepo.insert({
      nombre: 'Cable de cobre', unidad: 'm',
      stockActual: 15, stockMin: 10, stockMax: 100, categoryId,
    });
    materialId = matInsert.identifiers[0].id;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.access_token;
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

  describe('Alert creation via inventory exit', () => {
    it('exit reducing stock below minimum triggers LOW_STOCK alert', async () => {
      // Stock is 15, min is 10. Exit 8 units → stock=7 → below min
      await request(app.getHttpServer())
        .post('/api/inventory/exits')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ materialId, cantidad: 8, motivo: 'Test exit' })
        .expect(201);

      const unread = await request(app.getHttpServer())
        .get('/api/alerts/unread')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const alert = unread.body.find((a: any) => a.materialId === materialId && a.tipo === 'stock_bajo');
      expect(alert).toBeDefined();
      expect(alert.leida).toBe(false);
    });

    it('second exit does NOT create duplicate unread alert', async () => {
      // Stock is now 7, min is 10. Another exit → still below min
      await request(app.getHttpServer())
        .post('/api/inventory/exits')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ materialId, cantidad: 1, motivo: 'Test exit 2' })
        .expect(201);

      const unread = await request(app.getHttpServer())
        .get('/api/alerts/unread')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const alerts = unread.body.filter((a: any) => a.materialId === materialId && a.tipo === 'stock_bajo');
      expect(alerts).toHaveLength(1);
    });
  });

  describe('GET /api/alerts/count', () => {
    it('returns correct unread count', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/alerts/count')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PATCH /api/alerts/:id/read', () => {
    it('marks alert as read and removes from unread list', async () => {
      const unreadBefore = await request(app.getHttpServer())
        .get('/api/alerts/unread')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const alert = unreadBefore.body.find((a: any) => a.materialId === materialId);
      expect(alert).toBeDefined();

      await request(app.getHttpServer())
        .patch(`/api/alerts/${alert.id}/read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const unreadAfter = await request(app.getHttpServer())
        .get('/api/alerts/unread')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const stillUnread = unreadAfter.body.find((a: any) => a.id === alert.id);
      expect(stillUnread).toBeUndefined();
    });
  });

  describe('CRITICAL_STOCK alert', () => {
    it('exit to stock=0 creates CRITICAL_STOCK alert', async () => {
      // Current stock is 6 (started 15, -8, -1). Exit all → stock=0
      const mat = await materialRepo.findOne({ where: { id: materialId } });
      const remaining = Number(mat!.stockActual);

      await request(app.getHttpServer())
        .post('/api/inventory/exits')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ materialId, cantidad: remaining, motivo: 'Drain to zero' })
        .expect(201);

      const unread = await request(app.getHttpServer())
        .get('/api/alerts/unread')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const critical = unread.body.find((a: any) => a.materialId === materialId && a.tipo === 'stock_critico');
      expect(critical).toBeDefined();
    });
  });

  describe('GET /api/alerts', () => {
    it('returns paginated list of all alerts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });
  });
});
