import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { WorkOrder } from './work-order.entity';
import { Material } from '../../materials/entities/material.entity';

const decimalTransformer = {
  from: (v: string | number) => (v === null || v === undefined ? v : parseFloat(String(v))),
  to: (v: number) => v,
};

@Entity('work_order_materials')
export class WorkOrderMaterial extends BaseEntity {
  @ManyToOne(() => WorkOrder, (wo) => wo.materials)
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column()
  workOrderId: number;

  @ManyToOne(() => Material, { eager: true })
  @JoinColumn({ name: 'materialId' })
  material: Material;

  @Column()
  materialId: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: decimalTransformer })
  cantidadUsada: number;

  @Column({ type: 'timestamp' })
  fecha: Date;
}
