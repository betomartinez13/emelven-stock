import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

const mockQB = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
});

const mockRepo = () => ({
  createQueryBuilder: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: getRepositoryToken(AuditLog), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repo = module.get(getRepositoryToken(AuditLog));
  });

  describe('log', () => {
    it('saves audit record with correct fields', async () => {
      const entry = { id: 1, accion: AuditAction.CREATE };
      repo.create.mockReturnValue(entry);
      repo.save.mockResolvedValue(entry);

      await service.log({
        userId: 1,
        entidad: 'Material',
        entidadId: 5,
        accion: AuditAction.CREATE,
        datosDespues: { nombre: 'Cable' },
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          entidad: 'Material',
          entidadId: 5,
          accion: AuditAction.CREATE,
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(entry);
    });

    it('handles null userId', async () => {
      repo.create.mockReturnValue({});
      repo.save.mockResolvedValue({});

      await service.log({ userId: null, entidad: 'Material', entidadId: null, accion: AuditAction.DELETE });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ accion: AuditAction.DELETE }),
      );
    });
  });

  describe('findAll', () => {
    it('returns paginated results', async () => {
      const qb = mockQB();
      qb.getManyAndCount.mockResolvedValue([[{ id: 1 }], 1]);
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('applies entidad filter', async () => {
      const qb = mockQB();
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, entidad: 'Material' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('entidad'),
        expect.objectContaining({ entidad: 'Material' }),
      );
    });

    it('applies accion filter', async () => {
      const qb = mockQB();
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, accion: AuditAction.CREATE });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('accion'),
        expect.objectContaining({ accion: AuditAction.CREATE }),
      );
    });

    it('applies userId filter', async () => {
      const qb = mockQB();
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, userId: 3 });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('userId'),
        expect.objectContaining({ userId: 3 }),
      );
    });

    it('applies date range filters', async () => {
      const qb = mockQB();
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ page: 1, limit: 10, fechaDesde: '2026-01-01', fechaHasta: '2026-12-31' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('fechaDesde'),
        expect.any(Object),
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('fechaHasta'),
        expect.any(Object),
      );
    });
  });
});
