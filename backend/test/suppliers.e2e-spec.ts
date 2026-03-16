import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { Supplier } from '../src/modules/suppliers/entities/supplier.entity';
import { Material } from '../src/modules/materials/entities/material.entity';
import { InventoryEntry } from '../src/modules/inventory/entities/inventory-entry.entity';
import { InventoryExit } from '../src/modules/inventory/entities/inventory-exit.entity';
import { Repository } from 'typeorm';

describe('Suppliers (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let supplierRepo: Repository<Supplier>;
  let materialRepo: Repository<Material>;
  let entryRepo: Repository<InventoryEntry>;
  let exitRepo: Repository<InventoryExit>;
  let adminToken: string;
  let warehouseToken: string;
  let createdSupplierId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    supplierRepo = moduleFixture.get<Repository<Supplier>>(getRepositoryToken(Supplier));
    materialRepo = moduleFixture.get<Repository<Material>>(getRepositoryToken(Material));
    entryRepo = moduleFixture.get<Repository<InventoryEntry>>(getRepositoryToken(InventoryEntry));
    exitRepo = moduleFixture.get<Repository<InventoryExit>>(getRepositoryToken(InventoryExit));

    // FK-safe cleanup: inventory → materials → suppliers → users
    await exitRepo.createQueryBuilder().delete().execute();
    await entryRepo.createQueryBuilder().delete().execute();
    await materialRepo.createQueryBuilder().delete().execute();
    await supplierRepo.createQueryBuilder().delete().execute();
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
    await exitRepo.createQueryBuilder().delete().execute();
    await entryRepo.createQueryBuilder().delete().execute();
    await materialRepo.createQueryBuilder().delete().execute();
    await supplierRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();
    await app.close();
  });

  describe('POST /api/suppliers', () => {
    it('admin can create a supplier', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Proveedor Eléctrico SA', telefono: '0261-1234567' })
        .expect(201);

      expect(res.body.nombre).toBe('Proveedor Eléctrico SA');
      createdSupplierId = res.body.id;
    });

    it('warehouse can also create a supplier', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ nombre: 'Proveedor Warehouse' })
        .expect(201);

      expect(res.body.nombre).toBe('Proveedor Warehouse');
      await supplierRepo.delete(res.body.id);
    });

    it('unauthenticated user cannot create (401)', () => {
      return request(app.getHttpServer())
        .post('/api/suppliers')
        .send({ nombre: 'Hack' })
        .expect(401);
    });
  });

  describe('GET /api/suppliers', () => {
    it('returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('warehouse can list suppliers', () => {
      return request(app.getHttpServer())
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(200);
    });

    it('search filters by nombre', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/suppliers?search=Eléctrico')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].nombre).toContain('Eléctrico');
    });
  });

  describe('GET /api/suppliers/:id', () => {
    it('returns supplier by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdSupplierId);
    });
  });

  describe('PATCH /api/suppliers/:id', () => {
    it('admin can update a supplier', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Proveedor Actualizado' })
        .expect(200);

      expect(res.body.nombre).toBe('Proveedor Actualizado');
    });

    it('warehouse can also update a supplier', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ contacto: 'Carlos' })
        .expect(200);

      expect(res.body.contacto).toBe('Carlos');
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    it('warehouse cannot delete a supplier (403)', () => {
      return request(app.getHttpServer())
        .delete(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(403);
    });

    it('admin can delete a supplier', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/suppliers/${createdSupplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBeDefined();
    });
  });
});
