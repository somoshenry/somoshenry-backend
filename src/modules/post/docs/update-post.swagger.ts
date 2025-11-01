import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdatePostDto } from '../dto/update-post.dto';

export function UpdatePostDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Actualizar un post existente' }),
    ApiParam({
      name: 'id',
      required: true,
      type: String,
      description: 'ID del post (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdatePostDto,
      examples: {
        updateContent: {
          summary: 'Actualizar contenido',
          value: {
            content: 'Contenido actualizado del post',
          },
        },
        updateType: {
          summary: 'Actualizar tipo y contenido',
          value: {
            content: 'Ahora esto es un post con imagen',
            type: 'IMAGE',
            mediaURL: 'https://example.com/images/updated.jpg',
          },
        },
        removeMedia: {
          summary: 'Remover multimedia',
          value: {
            type: 'TEXT',
            mediaURL: null,
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Post actualizado exitosamente',
      schema: {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          content: 'Contenido actualizado del post',
          type: 'TEXT',
          mediaURL: null,
          isInappropriate: false,
          createdAt: '2025-10-28T10:00:00.000Z',
          updatedAt: '2025-10-28T11:30:00.000Z',
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Juan Pérez',
            email: 'juan@example.com',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Datos de entrada inválidos',
    }),
    ApiResponse({
      status: 404,
      description: 'Post no encontrado',
    }),
    ApiBearerAuth('JWT-auth'),
  );
}
