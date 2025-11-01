import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function DeletePostDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Eliminar un post',
      description:
        'Elimina permanentemente un post. Requiere autenticación y permisos de admin o ser el autor del post.',
    }),
    ApiParam({
      name: 'id',
      required: true,
      type: String,
      description: 'ID del post a eliminar (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: 200,
      description: 'Post eliminado exitosamente',
      schema: {
        example: {
          message: 'Post deleted successfully',
          deletedPost: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            userId: '123e4567-e89b-12d3-a456-426614174000',
            content: 'Este post será eliminado',
            type: 'TEXT',
            mediaURL: null,
            isInappropriate: false,
            createdAt: '2025-10-28T10:00:00.000Z',
            updatedAt: '2025-10-28T10:00:00.000Z',
            user: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Juan Pérez',
              email: 'juan@example.com',
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autenticado',
    }),
    ApiResponse({
      status: 403,
      description: 'No autorizado - Requiere ser el autor del post o admin',
    }),
    ApiResponse({
      status: 404,
      description: 'Post no encontrado',
    }),
    ApiBearerAuth('JWT-auth'),
  );
}
