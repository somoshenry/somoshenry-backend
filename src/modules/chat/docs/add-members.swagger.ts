import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

export function AddMembersDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Agregar miembros a un grupo existente',
      description:
        'Permite a un administrador invitar nuevos usuarios a un grupo de chat. Solo los administradores pueden ejecutar esta acción.',
    }),
    ApiParam({
      name: 'groupId',
      description: 'ID del grupo al que se desea agregar nuevos miembros',
      required: true,
      type: String,
      example: '2b8d7b7e-6a4d-4e7f-bf45-9e3e8a173a4a',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          userIds: {
            type: 'array',
            items: { type: 'string' },
            example: [
              '4c2a9f7e-7f89-4a55-8210-9b54de85f1b2',
              '7d3c5e9a-8b12-4a75-9930-5a7c9b2e1f11',
            ],
            description:
              'Lista de IDs de los usuarios que serán agregados al grupo.',
          },
        },
        required: ['userIds'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Miembros agregados exitosamente al grupo',
      schema: {
        example: {
          added: [
            '4c2a9f7e-7f89-4a55-8210-9b54de85f1b2',
            '7d3c5e9a-8b12-4a75-9930-5a7c9b2e1f11',
          ],
        },
      },
    }),
    ApiResponse({
      status: 403,
      description:
        'El usuario no pertenece al grupo o no tiene permisos de administrador.',
    }),
    ApiResponse({
      status: 404,
      description: 'Grupo o usuarios no encontrados.',
    }),
    ApiResponse({
      status: 400,
      description: 'Solicitud inválida (faltan datos o IDs incorrectos).',
    }),
  );
}
