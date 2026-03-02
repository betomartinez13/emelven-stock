import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;
}
