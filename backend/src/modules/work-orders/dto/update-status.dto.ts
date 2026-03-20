import { IsEnum } from 'class-validator';
import { WorkOrderStatus } from '../entities/work-order.entity';

export class UpdateStatusDto {
  @IsEnum(WorkOrderStatus)
  estado: WorkOrderStatus;
}
