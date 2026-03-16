import { IsInt, IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEntryDto {
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
  fechaEntrada?: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}
