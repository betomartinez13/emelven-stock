import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { WorkOrderStatus } from '../entities/work-order.entity';

export class WorkOrderFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  estado?: WorkOrderStatus;
}
