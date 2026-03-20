import { IsString, IsDateString, MinLength } from 'class-validator';

export class CreateWorkOrderDto {
  @IsString()
  @MinLength(3)
  descripcion: string;

  @IsString()
  @MinLength(2)
  cliente: string;

  @IsDateString()
  fechaInicio: string;
}
