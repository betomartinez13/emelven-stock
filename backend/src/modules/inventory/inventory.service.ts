import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryEntry } from './entities/inventory-entry.entity';
import { InventoryExit } from './entities/inventory-exit.entity';
import { Material } from '../materials/entities/material.entity';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateExitDto } from './dto/create-exit.dto';
import { InventoryFilterDto } from './dto/inventory-filter.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

export interface MovementItem {
  id: number;
  type: 'entry' | 'exit';
  cantidad: number;
  date: Date;
  observacion?: string;
  motivo?: string;
  userId: number;
  workOrderId?: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryEntry)
    private entriesRepository: Repository<InventoryEntry>,
    @InjectRepository(InventoryExit)
    private exitsRepository: Repository<InventoryExit>,
    @InjectRepository(Material)
    private materialsRepository: Repository<Material>,
    private dataSource: DataSource,
  ) {}

  async createEntry(dto: CreateEntryDto, userId: number): Promise<InventoryEntry> {
    return this.dataSource.transaction(async (manager) => {
      const material = await manager.findOne(Material, {
        where: { id: dto.materialId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!material) throw new NotFoundException('Material no encontrado');

      const entry = manager.create(InventoryEntry, {
        ...dto,
        userId,
        fechaEntrada: dto.fechaEntrada ? new Date(dto.fechaEntrada) : new Date(),
      });
      await manager.save(entry);

      await manager.update(Material, material.id, {
        stockActual: Number(material.stockActual) + Number(dto.cantidad),
      });

      return entry;
    });
  }

  async createExit(dto: CreateExitDto, userId: number): Promise<InventoryExit> {
    return this.dataSource.transaction(async (manager) => {
      const material = await manager.findOne(Material, {
        where: { id: dto.materialId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!material) throw new NotFoundException('Material no encontrado');

      if (Number(material.stockActual) < Number(dto.cantidad)) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${material.stockActual} ${material.unidad}`,
        );
      }

      const exit = manager.create(InventoryExit, {
        ...dto,
        userId,
        fechaSalida: dto.fechaSalida ? new Date(dto.fechaSalida) : new Date(),
      });
      await manager.save(exit);

      await manager.update(Material, material.id, {
        stockActual: Number(material.stockActual) - Number(dto.cantidad),
      });

      return exit;
    });
  }

  async findAllEntries(dto: InventoryFilterDto): Promise<PaginatedResult<InventoryEntry>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const qb = this.entriesRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.material', 'material')
      .leftJoinAndSelect('entry.user', 'user')
      .orderBy('entry.fechaEntrada', 'DESC');

    if (dto.materialId) {
      qb.andWhere('entry.materialId = :materialId', { materialId: dto.materialId });
    }
    if (dto.fechaDesde) {
      qb.andWhere('entry.fechaEntrada >= :fechaDesde', { fechaDesde: new Date(dto.fechaDesde) });
    }
    if (dto.fechaHasta) {
      qb.andWhere('entry.fechaEntrada <= :fechaHasta', { fechaHasta: new Date(dto.fechaHasta) });
    }

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllExits(dto: InventoryFilterDto): Promise<PaginatedResult<InventoryExit>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const qb = this.exitsRepository
      .createQueryBuilder('exit')
      .leftJoinAndSelect('exit.material', 'material')
      .leftJoinAndSelect('exit.user', 'user')
      .orderBy('exit.fechaSalida', 'DESC');

    if (dto.materialId) {
      qb.andWhere('exit.materialId = :materialId', { materialId: dto.materialId });
    }
    if (dto.fechaDesde) {
      qb.andWhere('exit.fechaSalida >= :fechaDesde', { fechaDesde: new Date(dto.fechaDesde) });
    }
    if (dto.fechaHasta) {
      qb.andWhere('exit.fechaSalida <= :fechaHasta', { fechaHasta: new Date(dto.fechaHasta) });
    }

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMovements(materialId: number): Promise<MovementItem[]> {
    const material = await this.materialsRepository.findOne({ where: { id: materialId } });
    if (!material) throw new NotFoundException('Material no encontrado');

    const entries = await this.entriesRepository.find({ where: { materialId } });
    const exits = await this.exitsRepository.find({ where: { materialId } });

    const movements: MovementItem[] = [
      ...entries.map((e) => ({
        id: e.id,
        type: 'entry' as const,
        cantidad: e.cantidad,
        date: e.fechaEntrada,
        observacion: e.observacion,
        userId: e.userId,
      })),
      ...exits.map((e) => ({
        id: e.id,
        type: 'exit' as const,
        cantidad: e.cantidad,
        date: e.fechaSalida,
        motivo: e.motivo,
        userId: e.userId,
        workOrderId: e.workOrderId,
      })),
    ];

    return movements.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}
