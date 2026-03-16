import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Material } from '../materials/entities/material.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Material)
    private materialsRepository: Repository<Material>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    const materialCount = await this.materialsRepository.count({ where: { categoryId: id } });
    if (materialCount > 0) {
      throw new ConflictException(`No se puede eliminar: ${materialCount} materiales usan esta categoría`);
    }
    await this.categoriesRepository.delete(id);
    return { message: 'Categoría eliminada correctamente' };
  }
}
