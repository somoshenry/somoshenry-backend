import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function LeaveGroupDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Abandonar un grupo de chat' }),
    ApiParam({ name: 'groupId', description: 'ID del grupo' }),
    ApiResponse({ status: 200, description: 'Has abandonado el grupo' }),
    ApiResponse({
      status: 404,
      description: 'Grupo no encontrado o usuario no pertenece',
    }),
  );
}
