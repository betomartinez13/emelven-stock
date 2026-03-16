import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/material.entity';
import { Category } from '../categories/entities/category.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { InventoryEntry } from '../inventory/entities/inventory-entry.entity';
import { InventoryExit } from '../inventory/entities/inventory-exit.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialFilterDto } from './dto/material-filter.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private materialsRepository: Repository<Material>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
    @InjectRepository(InventoryEntry)
    private entriesRepository: Repository<InventoryEntry>,
    @InjectRepository(InventoryExit)
    private exitsRepository: Repository<InventoryExit>,
  ) {}

  async findAll(dto: MaterialFilterDto): Promise<PaginatedResult<Material>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const qb = this.materialsRepository
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.category', 'category')
      .leftJoinAndSelect('material.supplier', 'supplier');

    if (dto.search) {
      qb.andWhere('material.nombre LIKE :search', { search: `%${dto.search}%` });
    }
    if (dto.categoryId) {
      qb.andWhere('material.categoryId = :categoryId', { categoryId: dto.categoryId });
    }
    if (dto.supplierId) {
      qb.andWhere('material.supplierId = :supplierId', { supplierId: dto.supplierId });
    }
    if (dto.stockStatus) {
      switch (dto.stockStatus) {
        case 'critical':
          qb.andWhere('material.stockActual <= 0');
          break;
        case 'low':
          qb.andWhere('material.stockActual > 0 AND material.stockActual < material.stockMin');
          break;
        case 'high':
          qb.andWhere('material.stockMax > 0 AND material.stockActual >= material.stockMax');
          break;
        case 'normal':
          qb.andWhere(
            'material.stockActual > 0 AND material.stockActual >= material.stockMin AND (material.stockMax = 0 OR material.stockActual < material.stockMax)',
          );
          break;
      }
    }

    qb.orderBy('material.nombre', 'ASC').skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findLowStock(): Promise<Material[]> {
    return this.materialsRepository
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.category', 'category')
      .leftJoinAndSelect('material.supplier', 'supplier')
      .where('material.stockActual < material.stockMin')
      .andWhere('material.stockMin > 0')
      .orderBy('material.stockActual', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<Material> {
    const material = await this.materialsRepository.findOne({ where: { id } });
    if (!material) throw new NotFoundException('Material no encontrado');
    return material;
  }

  async create(dto: CreateMaterialDto): Promise<Material> {
    const category = await this.categoriesRepository.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    if (dto.supplierId) {
      const supplier = await this.suppliersRepository.findOne({ where: { id: dto.supplierId } });
      if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    }

    const material = this.materialsRepository.create(dto);
    return this.materialsRepository.save(material);
  }

  async update(id: number, dto: UpdateMaterialDto): Promise<Material> {
    const material = await this.findOne(id);

    if (dto.stockMax !== undefined && dto.stockMax < material.stockActual) {
      throw new BadRequestException('stockMax no puede ser menor que el stock actual');
    }

    Object.assign(material, dto);
    return this.materialsRepository.save(material);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);

    const entryCount = await this.entriesRepository.count({ where: { materialId: id } });
    if (entryCount > 0) {
      throw new ConflictException(`No se puede eliminar: ${entryCount} entradas de inventario usan este material`);
    }

    const exitCount = await this.exitsRepository.count({ where: { materialId: id } });
    if (exitCount > 0) {
      throw new ConflictException(`No se puede eliminar: ${exitCount} salidas de inventario usan este material`);
    }

    await this.materialsRepository.delete(id);
    return { message: 'Material eliminado correctamente' };
  }
}
