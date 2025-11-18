import { IsString, IsNumber, IsPositive } from 'class-validator';

export class RequestProductDto {
  @IsString()
  title: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;
}
