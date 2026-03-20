import { IsOptional, IsInt, IsString, IsDateString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workOrderId?: number;

  @IsString()
  @MinLength(2)
  cliente: string;

  @IsString()
  @MinLength(2)
  producto: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad?: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  observacion?: string;
}
