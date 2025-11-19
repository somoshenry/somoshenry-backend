import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function GetGroupByIdDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener un grupo de chat (con participantes y roles)',
      description:
        'Devuelve la información del grupo junto con todos los participantes y sus roles (ADMIN, MEMBER, etc.).',
    }),
    ApiParam({
      name: 'groupId',
      description: 'ID del grupo',
      type: 'string',
      example: '8a29f36d-03da-4a77-9e79-7a3b63b7df6c',
    }),
    ApiResponse({
      status: 200,
      description: 'Información completa del grupo',
      schema: {
        example: {
          id: '8a29f36d-03da-4a77-9e79-7a3b63b7df6c',
          name: 'Equipo Backend',
          description: 'Canal para el equipo de desarrollo backend',
          imageUrl: 'https://res.cloudinary.com/demo/image/upload/team.png',
          createdAt: '2025-11-10T18:00:00.000Z',
          participants: [
            {
              id: '2a1e4e62-6f1f-4211-b76b-13dc73951b6a',
              name: 'Valentín',
              email: 'valen@example.com',
              profilePicture:
                'https://res.cloudinary.com/demo/image/upload/v1/users/valen.png',
              role: 'ADMIN',
              joinedAt: '2025-11-10T18:00:00.000Z',
            },
            {
              id: 'c96b02db-6b89-4f9a-b5d5-8b7f469c6d89',
              name: 'Andre',
              email: 'andre@example.com',
              profilePicture:
                'https://res.cloudinary.com/demo/image/upload/v1/users/andre.png',
              role: 'MEMBER',
              joinedAt: '2025-11-10T18:05:00.000Z',
            },
          ],
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Grupo no encontrado' }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}
