import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function PromoteMemberDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Promover un miembro del grupo a administrador' }),
    ApiParam({ name: 'groupId', description: 'ID del grupo' }),
    ApiParam({ name: 'userId', description: 'ID del usuario a promover' }),
    ApiResponse({
      status: 200,
      description: 'Miembro promovido correctamente',
    }),
    ApiResponse({ status: 403, description: 'No tienes permisos' }),
    ApiResponse({ status: 404, description: 'Miembro o grupo no encontrado' }),
  );
}
