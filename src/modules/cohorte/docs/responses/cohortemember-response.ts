import { ApiProperty } from '@nestjs/swagger';
import {
  CohorteRoleEnum,
  MemberStatusEnum,
} from '../../cohorte/enums/cohorte.enums';

export class CohortememberUserResponseDto {
  @ApiProperty({
    description: 'Identificador único del usuario',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez López',
  })
  fullName: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.perez@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Avatar o URL de foto de perfil',
    example: 'https://avatars.example.com/juan-perez.jpg',
    nullable: true,
  })
  avatar?: string;
}

export class CohortememberResponseDto {
  @ApiProperty({
    description: 'Identificador único del miembro en la cohorte',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Datos del usuario miembro',
    type: CohortememberUserResponseDto,
  })
  user: CohortememberUserResponseDto;

  @ApiProperty({
    description: 'Rol del usuario dentro de la cohorte',
    enum: CohorteRoleEnum,
    example: CohorteRoleEnum.STUDENT,
  })
  role: CohorteRoleEnum;

  @ApiProperty({
    description: 'Estado del miembro en la cohorte',
    enum: MemberStatusEnum,
    example: MemberStatusEnum.ACTIVE,
  })
  status: MemberStatusEnum;

  @ApiProperty({
    description: 'Porcentaje de asistencia (0-100)',
    example: 92.5,
    nullable: true,
    type: 'number',
  })
  attendance?: number;

  @ApiProperty({
    description: 'Calificación final del miembro (0-100)',
    example: 87.0,
    nullable: true,
    type: 'number',
  })
  finalGrade?: number;

  @ApiProperty({
    description: 'Fecha en que el usuario se unió a la cohorte',
    example: '2024-01-15T08:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  joinedAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-20T15:30:00Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}
