import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GmailResponseDto {
  @ApiProperty({
    description: 'ID único del mensaje asignado por la Gmail API.',
    example: '18b32e01b44b8b6e',
  })
  @IsString() // Decorador útil si este DTO se reutiliza en validación de entrada
  @IsNotEmpty()
  dataId: string;

  @ApiProperty({
    description: 'Estado de la operación de envío.',
    example: 'success',
    default: 'success', // Muestra que este es el valor predeterminado
  })
  @IsString()
  status: string = 'success';
}
