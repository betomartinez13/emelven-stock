import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity';
import { WorkOrderMaterial } from './entities/work-order-material.entity';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AddMaterialDto } from './dto/add-material.dto';
import { WorkOrderFilterDto } from './dto/work-order-filter.dto';
import { InventoryService } from '../inventory/inventory.service';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private workOrdersRepo: Repository<WorkOrder>,
    @InjectRepository(WorkOrderMaterial)
    private workOrderMaterialsRepo: Repository<WorkOrderMaterial>,
    private inventoryService: InventoryService,
  ) {}

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.workOrdersRepo.count({
      where: { codigo: Like(`OT-${year}-%`) },
    });
    return `OT-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  private validateTransition(current: WorkOrderStatus, next: WorkOrderStatus): void {
    const allowed: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      [WorkOrderStatus.PENDING]:     [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
      [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED],
      [WorkOrderStatus.COMPLETED]:   [],
      [WorkOrderStatus.CANCELLED]:   [],
    };
    if (!allowed[current].includes(next)) {
      throw new BadRequestException(`No se puede cambiar de "${current}" a "${next}"`);
    }
  }

  async create(dto: CreateWorkOrderDto): Promise<WorkOrder> {
    const codigo = await this.generateCode();
    const workOrder = this.workOrdersRepo.create({
      ...dto,
      codigo,
      fechaInicio: new Date(dto.fechaInicio),
    });
    return this.workOrdersRepo.save(workOrder);
  }

  async findAll(dto: WorkOrderFilterDto): Promise<PaginatedResult<WorkOrder>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const qb = this.workOrdersRepo
      .createQueryBuilder('wo')
      .orderBy('wo.createdAt', 'DESC');

    if (dto.estado) {
      qb.andWhere('wo.estado = :estado', { estado: dto.estado });
    }
    if (dto.search) {
      qb.andWhere('(wo.codigo LIKE :search OR wo.cliente LIKE :search OR wo.descripcion LIKE :search)', {
        search: `%${dto.search}%`,
      });
    }

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<WorkOrder> {
    const wo = await this.workOrdersRepo.findOne({
      where: { id },
      relations: ['materials', 'materials.material'],
    });
    if (!wo) throw new NotFoundException('Orden de trabajo no encontrada');
    return wo;
  }

  async update(id: number, dto: UpdateWorkOrderDto): Promise<WorkOrder> {
    const wo = await this.findOne(id);
    Object.assign(wo, dto);
    return this.workOrdersRepo.save(wo);
  }

  async updateStatus(id: number, dto: UpdateStatusDto): Promise<WorkOrder> {
    const wo = await this.findOne(id);
    this.validateTransition(wo.estado, dto.estado);
    wo.estado = dto.estado;
    if (dto.estado === WorkOrderStatus.COMPLETED) {
      wo.fechaFin = new Date();
    }
    return this.workOrdersRepo.save(wo);
  }

  async addMaterial(id: number, dto: AddMaterialDto, userId: number): Promise<WorkOrderMaterial> {
    const wo = await this.findOne(id);
    if (wo.estado !== WorkOrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Solo se pueden agregar materiales a órdenes en progreso');
    }

    await this.inventoryService.createExit(
      {
        materialId: dto.materialId,
        cantidad: dto.cantidadUsada,
        workOrderId: id,
        motivo: `Consumo en orden de trabajo ${wo.codigo}`,
      },
      userId,
    );

    const consumption = this.workOrderMaterialsRepo.create({
      workOrderId: id,
      materialId: dto.materialId,
      cantidadUsada: dto.cantidadUsada,
      fecha: new Date(),
    });
    return this.workOrderMaterialsRepo.save(consumption);
  }

  async getMaterials(id: number): Promise<WorkOrderMaterial[]> {
    await this.findOne(id);
    return this.workOrderMaterialsRepo.find({
      where: { workOrderId: id },
      relations: ['material'],
      order: { fecha: 'DESC' },
    });
  }
}
