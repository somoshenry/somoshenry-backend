import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiTags } from '@nestjs/swagger';

export function PromoteMemberDocs() {
  return applyDecorators(
    ApiTags('Chat - Grupos'),
    ApiOperation({
      summary: 'Promueve a un miembro a administrador del grupo',
      description:
        'Solo un administrador del grupo puede ejecutar esta acción para promover a otro miembro.',
    }),
    ApiParam({ name: 'groupId', description: 'UUID del grupo' }),
    ApiParam({ name: 'userId', description: 'UUID del miembro a promover' }),
    ApiResponse({
      status: 200,
      description: 'Miembro promovido correctamente',
    }),
    ApiResponse({ status: 403, description: 'Permisos insuficientes' }),
    ApiResponse({ status: 404, description: 'Miembro no encontrado' }),
  );
}

export function RemoveMemberDocs() {
  return applyDecorators(
    ApiTags('Chat - Grupos'),
    ApiOperation({
      summary: 'Elimina un miembro del grupo',
      description:
        'Permite a un administrador eliminar a un miembro del grupo. Esta acción no puede ser ejecutada por miembros comunes.',
    }),
    ApiParam({ name: 'groupId', description: 'UUID del grupo' }),
    ApiParam({ name: 'userId', description: 'UUID del miembro a eliminar' }),
    ApiResponse({
      status: 200,
      description: 'Miembro eliminado correctamente',
    }),
    ApiResponse({ status: 403, description: 'Permisos insuficientes' }),
    ApiResponse({ status: 404, description: 'Miembro no encontrado' }),
  );
}

export function LeaveGroupDocs() {
  return applyDecorators(
    ApiTags('Chat - Grupos'),
    ApiOperation({
      summary: 'Permite que el usuario abandone el grupo',
      description:
        'Cualquier miembro puede ejecutar esta acción para abandonar el grupo al que pertenece.',
    }),
    ApiParam({ name: 'groupId', description: 'UUID del grupo a abandonar' }),
    ApiResponse({
      status: 200,
      description: 'Usuario salió del grupo correctamente',
    }),
    ApiResponse({ status: 404, description: 'No pertenece al grupo' }),
  );
}
