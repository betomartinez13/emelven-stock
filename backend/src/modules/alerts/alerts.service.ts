import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertType } from './entities/alert.entity';
import { Material } from '../materials/entities/material.entity';
import { AlertFilterDto } from './dto/alert-filter.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertsRepo: Repository<Alert>,
  ) {}

  async checkAndCreateAlert(material: Material): Promise<void> {
    const stockActual = Number(material.stockActual);
    const stockMin    = Number(material.stockMin);

    if (stockActual <= 0) {
      // Escalation: close any active LOW_STOCK for this material before creating CRITICAL.
      // Uses repo.update() — same pattern as markAllAsRead, proven to work with MySQL booleans.
      await this.alertsRepo.update(
        { materialId: material.id, tipo: AlertType.LOW_STOCK, leida: false },
        { leida: true },
      );
      await this.createAlertIfNotExists(
        material,
        AlertType.CRITICAL_STOCK,
        `CRÍTICO: ${material.nombre} tiene stock 0. Contactar proveedor inmediatamente.`,
      );
    } else if (stockMin > 0 && stockActual < stockMin) {
      await this.createAlertIfNotExists(
        material,
        AlertType.LOW_STOCK,
        `Stock bajo: ${material.nombre} tiene ${stockActual} ${material.unidad} (mínimo: ${stockMin} ${material.unidad})`,
      );
    }
  }

  private async createAlertIfNotExists(
    material: Material,
    tipo: AlertType,
    mensaje: string,
  ): Promise<void> {
    const active = await this.alertsRepo.count({
      where: { materialId: material.id, tipo, leida: false },
    });
    if (active > 0) return;
    await this.alertsRepo.save(this.alertsRepo.create({ materialId: material.id, tipo, mensaje }));
  }

  async findUnread(): Promise<Alert[]> {
    return this.alertsRepo.find({
      where: { leida: false },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async countUnread(): Promise<{ count: number }> {
    const count = await this.alertsRepo.count({ where: { leida: false } });
    return { count };
  }

  async findAll(dto: AlertFilterDto): Promise<PaginatedResult<Alert>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const qb = this.alertsRepo
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.material', 'material')
      .orderBy('alert.fechaCreacion', 'DESC');

    if (dto.tipo !== undefined) {
      qb.andWhere('alert.tipo = :tipo', { tipo: dto.tipo });
    }
    if (dto.leida !== undefined) {
      qb.andWhere('alert.leida = :leida', { leida: dto.leida });
    }
    if (dto.materialId) {
      qb.andWhere('alert.materialId = :materialId', { materialId: dto.materialId });
    }

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markAsRead(id: number): Promise<void> {
    const alert = await this.alertsRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Alerta no encontrada');
    await this.alertsRepo.update(id, { leida: true });
  }

  async markAllAsRead(): Promise<void> {
    await this.alertsRepo.update({ leida: false }, { leida: true });
  }
}
