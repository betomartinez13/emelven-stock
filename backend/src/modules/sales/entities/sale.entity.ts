import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { User } from '../../users/entities/user.entity';

@Entity('sales')
export class Sale extends BaseEntity {
  @ManyToOne(() => WorkOrder, { nullable: true, eager: true })
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column({ nullable: true })
  workOrderId: number;

  @Column()
  cliente: string;

  @Column()
  producto: string;

  @Column({ type: 'int', default: 1 })
  cantidad: number;

  @Column({ type: 'timestamp' })
  fecha: Date;

  @Column({ nullable: true })
  observacion: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
