import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<any>;

  const mockUser: Partial<User> = {
    id: 1,
    nombre: 'Admin',
    apellido: 'EMELVEN',
    email: 'admin@emelven.com',
    role: UserRole.ADMIN,
    isActive: true,
  };

  beforeEach(async () => {
    repo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      repo.findAndCount.mockResolvedValue([[mockUser], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 0 }),
      );
    });

    it('should filter by search term', async () => {
      repo.findAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({ page: 1, limit: 10, search: 'admin' });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { nombre: ILike('%admin%') },
            { apellido: ILike('%admin%') },
            { email: ILike('%admin%') },
          ],
        }),
      );
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      repo.save.mockResolvedValue({ ...mockUser, nombre: 'Actualizado' });

      const result = await service.update(1, { nombre: 'Actualizado' });

      expect(result.nombre).toBe('Actualizado');
      expect(repo.save).toHaveBeenCalled();
    });

    it('should hash new password if provided', async () => {
      repo.findOne.mockResolvedValue({ ...mockUser });
      repo.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');

      await service.update(1, { password: 'newpassword123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
    });

    it('should throw NotFoundException if user not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update(99, { nombre: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      repo.update.mockResolvedValue({ affected: 1 });

      await service.deactivate(1);

      expect(repo.update).toHaveBeenCalledWith(1, { isActive: false });
    });

    it('should throw NotFoundException if user not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.deactivate(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should not return deactivated user', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.findOne(1);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1, isActive: true } });
      expect(result).toBeNull();
    });
  });
});
