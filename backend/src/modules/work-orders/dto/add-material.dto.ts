import { IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddMaterialDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  materialId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  cantidadUsada: number;
}
