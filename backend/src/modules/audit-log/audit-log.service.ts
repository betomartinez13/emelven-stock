import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { AuditFilterDto } from './dto/audit-filter.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: {
    userId: number | null;
    entidad: string;
    entidadId: number | null;
    accion: AuditAction;
    datosAntes?: Record<string, any>;
    datosDespues?: Record<string, any>;
  }): Promise<void> {
    const entry = this.auditLogRepository.create({
      userId: data.userId ?? undefined,
      entidad: data.entidad,
      entidadId: data.entidadId ?? undefined,
      accion: data.accion,
      datosAntes: data.datosAntes ?? null,
      datosDespues: data.datosDespues ?? null,
    });
    await this.auditLogRepository.save(entry);
  }

  async findAll(dto: AuditFilterDto): Promise<PaginatedResult<AuditLog>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const qb = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.fecha', 'DESC');

    if (dto.entidad) {
      qb.andWhere('log.entidad = :entidad', { entidad: dto.entidad });
    }
    if (dto.accion) {
      qb.andWhere('log.accion = :accion', { accion: dto.accion });
    }
    if (dto.userId) {
      qb.andWhere('log.userId = :userId', { userId: dto.userId });
    }
    if (dto.fechaDesde) {
      qb.andWhere('log.fecha >= :fechaDesde', { fechaDesde: new Date(dto.fechaDesde) });
    }
    if (dto.fechaHasta) {
      qb.andWhere('log.fecha <= :fechaHasta', { fechaHasta: new Date(dto.fechaHasta) });
    }

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
