import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Material } from '../../materials/entities/material.entity';
import { User } from '../../users/entities/user.entity';

const decimalTransformer = {
  from: (v: string | number) => (v === null || v === undefined ? v : parseFloat(String(v))),
  to: (v: number) => v,
};

@Entity('inventory_entries')
export class InventoryEntry extends BaseEntity {
  @ManyToOne(() => Material, { eager: true })
  @JoinColumn({ name: 'materialId' })
  material: Material;

  @Column()
  materialId: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: decimalTransformer })
  cantidad: number;

  @Column({ type: 'timestamp' })
  fechaEntrada: Date;

  @Column({ nullable: true })
  observacion: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
