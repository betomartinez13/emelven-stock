import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  cliente?: string;
}
