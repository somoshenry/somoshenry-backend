import { IsString, IsEmail, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer'; // Necesario para anidar DTOs
import { RequestProductDto } from './request.product.dto';

export class RequestPreferenceDto {
  @IsString()
  userId: string;

  @IsString()
  @IsEmail()
  clientEmail: string;

  @IsArray()
  @ValidateNested({ each: true }) // Valida cada elemento del array
  @Type(() => RequestProductDto) // Especifica el tipo de elementos del array
  products: RequestProductDto[];
}
