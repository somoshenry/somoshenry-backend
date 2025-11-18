import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateAnnouncementRequestDto {
  @ApiProperty({
    description: 'Título del anuncio',
    example: 'Recordatorio importante',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Contenido del anuncio',
    example: 'Mañana tenemos clase a las 18:00',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  content: string;
}

export class UpdateAnnouncementRequestDto {
  @ApiProperty({
    description: 'Título del anuncio',
    example: 'Recordatorio importante actualizado',
    minLength: 3,
    maxLength: 200,
    required: false,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiProperty({
    description: 'Contenido del anuncio',
    example: 'Cambio de horario: ahora será a las 19:00',
    minLength: 1,
    required: false,
  })
  @IsString()
  @MinLength(1)
  content?: string;
}
