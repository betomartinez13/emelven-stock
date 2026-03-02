import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
  ) {}

  async findAll(dto: PaginationDto): Promise<PaginatedResult<Supplier>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const [data, total] = await this.suppliersRepository.findAndCount({
      where: dto.search ? { nombre: ILike(`%${dto.search}%`) } : {},
      order: { nombre: 'ASC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.suppliersRepository.create(dto);
    return this.suppliersRepository.save(supplier);
  }

  async update(id: number, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, dto);
    return this.suppliersRepository.save(supplier);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    // TODO Phase 09: throw ConflictException if any Material references this supplier
    await this.suppliersRepository.delete(id);
    return { message: 'Proveedor eliminado correctamente' };
  }
}
