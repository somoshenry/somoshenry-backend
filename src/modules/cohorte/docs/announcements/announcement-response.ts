import { ApiProperty } from '@nestjs/swagger';

export class AnnouncementResponseDto {
  @ApiProperty({
    description: 'Identificador único del anuncio',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Título del anuncio',
    example: 'Recordatorio importante',
  })
  title: string;

  @ApiProperty({
    description: 'Contenido del anuncio',
    example: 'Mañana tenemos clase a las 18:00',
  })
  content: string;

  @ApiProperty({
    description: 'ID de la cohorte',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  cohorteId: string;

  @ApiProperty({
    description: 'ID del usuario que creó el anuncio',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Indicador si el anuncio está fijado',
    example: false,
  })
  isPinned: boolean;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-01-15T10:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-01-15T11:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}
