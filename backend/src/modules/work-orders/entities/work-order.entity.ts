import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { WorkOrderMaterial } from './work-order-material.entity';

export enum WorkOrderStatus {
  PENDING     = 'pendiente',
  IN_PROGRESS = 'en_progreso',
  COMPLETED   = 'completada',
  CANCELLED   = 'cancelada',
}

@Entity('work_orders')
export class WorkOrder extends BaseEntity {
  @Column({ unique: true })
  codigo: string;

  @Column()
  descripcion: string;

  @Column()
  cliente: string;

  @Column({ type: 'enum', enum: WorkOrderStatus, default: WorkOrderStatus.PENDING })
  estado: WorkOrderStatus;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date', nullable: true })
  fechaFin: Date;

  @OneToMany(() => WorkOrderMaterial, (wom) => wom.workOrder, { cascade: true })
  materials: WorkOrderMaterial[];
}
