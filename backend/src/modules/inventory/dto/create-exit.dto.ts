import { IsInt, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExitDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  materialId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @IsOptional()
  @IsDateString()
  fechaSalida?: string;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workOrderId?: number;
}
