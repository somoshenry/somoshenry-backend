import { ApiProperty } from '@nestjs/swagger';
import { CohorteResponseDto } from './cohorte-response';

export class CohorteWithMembersResponseDto extends CohorteResponseDto {
  @ApiProperty({
    description: 'Lista de miembros de la cohorte con sus roles y estado',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          description: 'ID del miembro',
        },
        user: {
          type: 'object',
          description: 'Información del usuario',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fullName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            avatar: { type: 'string', nullable: true },
          },
        },
        role: {
          type: 'string',
          enum: ['ADMIN', 'TEACHER', 'TA', 'STUDENT'],
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE', 'GRADUATED', 'DROPPED'],
        },
        attendance: { type: 'number', nullable: true },
        finalGrade: { type: 'number', nullable: true },
        joinedAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  members: Array<{
    id: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      avatar?: string;
    };
    role: string;
    status: string;
    attendance?: number;
    finalGrade?: number;
    joinedAt: Date;
    updatedAt: Date;
  }>;
}
