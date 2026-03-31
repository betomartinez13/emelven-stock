import { IsString, IsOptional, IsNumber, IsInt, Min, MinLength, MaxLength } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiProperty({ example: 'kg', description: 'kg, m, unidad, litro, rollo, m2, par' })
  @IsString()
  unidad: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockActual?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockMin?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockMax?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === 0 || value === '' ? undefined : value))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplierId?: number;
}
