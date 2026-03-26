import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { Alert, AlertType } from './entities/alert.entity';
import { Material } from '../materials/entities/material.entity';

const mockMaterial = (overrides = {}): Material =>
  ({
    id: 1, nombre: 'Cable de cobre', unidad: 'm',
    stockActual: 5, stockMin: 10, stockMax: 100,
    ...overrides,
  } as Material);

const mockAlert = (overrides = {}): Alert =>
  ({
    id: 1, materialId: 1, tipo: AlertType.LOW_STOCK,
    mensaje: 'Stock bajo', leida: false, fechaCreacion: new Date(),
    ...overrides,
  } as Alert);

const mockQB = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[mockAlert()], 1]),
});

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('AlertsService', () => {
  let service: AlertsService;
  let alertsRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: getRepositoryToken(Alert), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    alertsRepo = module.get(getRepositoryToken(Alert));
  });

  describe('checkAndCreateAlert', () => {
    it('creates LOW_STOCK alert when stockActual < stockMin', async () => {
      alertsRepo.findOne.mockResolvedValue(null);
      alertsRepo.create.mockReturnValue(mockAlert());
      alertsRepo.save.mockResolvedValue(mockAlert());

      await service.checkAndCreateAlert(mockMaterial({ stockActual: 5, stockMin: 10 }));

      expect(alertsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: AlertType.LOW_STOCK }),
      );
    });

    it('creates CRITICAL_STOCK alert when stockActual = 0', async () => {
      alertsRepo.findOne.mockResolvedValue(null);
      alertsRepo.create.mockReturnValue(mockAlert({ tipo: AlertType.CRITICAL_STOCK }));
      alertsRepo.save.mockResolvedValue(mockAlert({ tipo: AlertType.CRITICAL_STOCK }));

      await service.checkAndCreateAlert(mockMaterial({ stockActual: 0, stockMin: 10 }));

      expect(alertsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: AlertType.CRITICAL_STOCK }),
      );
    });

    it('does NOT create duplicate unread alert for same material + tipo', async () => {
      alertsRepo.findOne.mockResolvedValue(mockAlert()); // existing unread alert

      await service.checkAndCreateAlert(mockMaterial({ stockActual: 5, stockMin: 10 }));

      expect(alertsRepo.save).not.toHaveBeenCalled();
    });

    it('does NOT create alert when stock is above minimum', async () => {
      await service.checkAndCreateAlert(mockMaterial({ stockActual: 50, stockMin: 10 }));
      expect(alertsRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('marks alert as read', async () => {
      alertsRepo.findOne.mockResolvedValue(mockAlert());
      alertsRepo.update.mockResolvedValue({ affected: 1 });

      await service.markAsRead(1);
      expect(alertsRepo.update).toHaveBeenCalledWith(1, { leida: true });
    });

    it('throws NotFoundException for non-existent alert', async () => {
      alertsRepo.findOne.mockResolvedValue(null);
      await expect(service.markAsRead(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread alerts as read', async () => {
      alertsRepo.update.mockResolvedValue({ affected: 3 });
      await service.markAllAsRead();
      expect(alertsRepo.update).toHaveBeenCalledWith({ leida: false }, { leida: true });
    });
  });

  describe('findUnread', () => {
    it('returns only unread alerts', async () => {
      alertsRepo.find.mockResolvedValue([mockAlert()]);
      const result = await service.findUnread();
      expect(result).toHaveLength(1);
      expect(alertsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { leida: false } }),
      );
    });
  });
});
