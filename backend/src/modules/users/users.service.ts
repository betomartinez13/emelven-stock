import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id, isActive: true } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async findAll(dto: PaginationDto): Promise<PaginatedResult<User>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const [data, total] = await this.usersRepository.findAndCount({
      where: dto.search
        ? [
            { nombre: ILike(`%${dto.search}%`) },
            { apellido: ILike(`%${dto.search}%`) },
            { email: ILike(`%${dto.search}%`) },
          ]
        : {},
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async deactivate(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.usersRepository.update(id, { isActive: false });
    return { message: 'Usuario desactivado correctamente' };
  }
}
