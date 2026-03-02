import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column()
  nombre: string;

  @Column({ nullable: true })
  contacto: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  direccion: string;
}
