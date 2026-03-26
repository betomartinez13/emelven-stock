import { IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AlertType } from '../entities/alert.entity';

export class AlertFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(AlertType)
  tipo?: AlertType;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  leida?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  materialId?: number;
}
