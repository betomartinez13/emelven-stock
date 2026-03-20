import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { WorkOrder, WorkOrderStatus } from '../work-orders/entities/work-order.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleFilterDto } from './dto/sale-filter.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private salesRepo: Repository<Sale>,
    @InjectRepository(WorkOrder)
    private workOrdersRepo: Repository<WorkOrder>,
  ) {}

  async create(dto: CreateSaleDto, userId: number): Promise<Sale> {
    if (dto.workOrderId) {
      const wo = await this.workOrdersRepo.findOne({ where: { id: dto.workOrderId } });
      if (!wo) throw new NotFoundException('Orden de trabajo no encontrada');
      if (wo.estado !== WorkOrderStatus.COMPLETED) {
        throw new BadRequestException('Solo se pueden vincular ventas a órdenes completadas');
      }
    }

    const sale = this.salesRepo.create({
      ...dto,
      userId,
      fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
    });
    return this.salesRepo.save(sale);
  }

  async findAll(dto: SaleFilterDto): Promise<PaginatedResult<Sale>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const qb = this.salesRepo
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.workOrder', 'workOrder')
      .leftJoinAndSelect('sale.user', 'user')
      .orderBy('sale.fecha', 'DESC');

    if (dto.cliente) {
      qb.andWhere('sale.cliente LIKE :cliente', { cliente: `%${dto.cliente}%` });
    }
    if (dto.workOrderId) {
      qb.andWhere('sale.workOrderId = :workOrderId', { workOrderId: dto.workOrderId });
    }
    if (dto.fechaDesde) {
      qb.andWhere('sale.fecha >= :fechaDesde', { fechaDesde: new Date(dto.fechaDesde) });
    }
    if (dto.fechaHasta) {
      qb.andWhere('sale.fecha <= :fechaHasta', { fechaHasta: new Date(dto.fechaHasta) });
    }

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<Sale> {
    const sale = await this.salesRepo.findOne({
      where: { id },
      relations: ['workOrder', 'user'],
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }
}
