import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum } from 'class-validator';

export class MarkAttendanceRequestDto {
  @ApiProperty({
    description: 'Lista de estudiantes con su estado de asistencia',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        studentId: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        status: {
          type: 'string',
          enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
          example: 'PRESENT',
        },
      },
      required: ['studentId', 'status'],
    },
  })
  attendance: Array<{
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  }>;
}
