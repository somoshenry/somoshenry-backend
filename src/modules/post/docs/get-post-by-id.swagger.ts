import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function GetPostByIdDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Obtener un post por su ID' }),
    ApiParam({
      name: 'id',
      required: true,
      type: String,
      description: 'ID del post (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: 200,
      description: 'Post obtenido exitosamente',
      schema: {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          content: 'Este es el contenido del post',
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
    }),
    ApiResponse({
      status: 404,
      description: 'Post no encontrado',
    }),
  );
}
