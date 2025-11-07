import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({
    description: 'Correo electrónico del destinatario',
    example: 'usuario@example.com',
  })
  @IsEmail(
    {},
    { message: 'El campo "to" debe ser un correo electrónico válido' },
  )
  @IsNotEmpty({ message: 'El campo "to" no puede estar vacío' })
  to: string;
}
