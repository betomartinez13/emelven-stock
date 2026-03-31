import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Category } from '../../categories/entities/category.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';

const decimalTransformer = {
  from: (v: string | number) => (v === null || v === undefined ? v : parseFloat(String(v))),
  to: (v: number) => v,
};

@Entity('materials')
export class Material extends BaseEntity {
  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column()
  unidad: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  stockActual: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  stockMin: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  stockMax: number;

  @ManyToOne(() => Category, { eager: true, nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: number;

  @ManyToOne(() => Supplier, { eager: true, nullable: true })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ nullable: true })
  supplierId: number;

  get stockStatus(): 'critical' | 'low' | 'normal' | 'high' {
    if (this.stockActual <= 0) return 'critical';
    if (this.stockActual < this.stockMin) return 'low';
    if (this.stockMax > 0 && this.stockActual >= this.stockMax) return 'high';
    return 'normal';
  }
}
