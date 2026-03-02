import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let adminToken: string;
  let warehouseToken: string;
  let testUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));

    // Clean up and seed test users directly via insert() — bypasses @BeforeInsert so no double-hash
    await userRepo.clear();
    const hashedPassword = await bcrypt.hash('password123', 10);

    await userRepo.insert({
      nombre: 'Admin', apellido: 'Test', email: 'admin@test.com',
      password: hashedPassword, role: UserRole.ADMIN, isActive: true,
    });

    const warehouseInsert = await userRepo.insert({
      nombre: 'Warehouse', apellido: 'Test', email: 'warehouse@test.com',
      password: hashedPassword, role: UserRole.WAREHOUSE, isActive: true,
    });
    testUserId = warehouseInsert.identifiers[0].id;

    // Get tokens via login
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
    await userRepo.clear();
    await app.close();
  });

  describe('GET /api/users', () => {
    it('should return 200 for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('should return 403 for warehouse user', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .expect(403);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .expect(401);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user fields', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Updated' })
        .expect(200);

      expect(res.body.nombre).toBe('Updated');
    });

    it('should return 403 for non-admin', () => {
      return request(app.getHttpServer())
        .patch(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ nombre: 'Hacker' })
        .expect(403);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should deactivate user (soft delete)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const user = await userRepo.findOne({ where: { id: testUserId } });
      expect(user?.isActive).toBe(false);
    });

    it('deactivated user cannot login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'warehouse@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });
});
