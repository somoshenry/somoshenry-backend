import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function RemoveMemberDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Eliminar un miembro del grupo' }),
    ApiParam({ name: 'groupId', description: 'ID del grupo' }),
    ApiParam({ name: 'userId', description: 'ID del usuario a eliminar' }),
    ApiResponse({ status: 200, description: 'Miembro eliminado del grupo' }),
    ApiResponse({ status: 403, description: 'No tienes permisos' }),
    ApiResponse({ status: 404, description: 'Grupo o miembro no encontrado' }),
  );
}
