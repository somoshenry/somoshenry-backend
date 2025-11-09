import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GmailDataDto {
  @ApiProperty({
    description: 'Dirección de correo electrónico del destinatario.',
    example: 'ejemplo@dominio.com',
  })
  @IsEmail(
    {},
    { message: 'El campo "to" debe ser una dirección de correo válida.' },
  )
  @IsNotEmpty({ message: 'El campo "to" no puede estar vacío.' })
  to: string;

  @ApiProperty({
    description: 'Asunto del correo electrónico.',
    example: 'Confirmación de Pedido',
  })
  @IsString({ message: 'El campo "subject" debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo "subject" no puede estar vacío.' })
  subject: string;

  @ApiProperty({
    description: 'Cuerpo del correo electrónico en formato HTML.',
    example: '<h1>Hola</h1><p>Tu pedido ha sido enviado.</p>',
  })
  @IsString({ message: 'El campo "html" debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El campo "html" no puede estar vacío.' })
  html: string;
}
