import { IsOptional, IsString, IsEnum, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AuditAction } from '../entities/audit-log.entity';

export class AuditFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  entidad?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  accion?: AuditAction;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
