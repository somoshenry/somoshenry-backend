import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreatePostDto } from '../dto/create-post.dto';

export function CreatePostDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Crear un nuevo post' }),
    ApiBearerAuth('JWT-auth'),
    ApiBody({
      type: CreatePostDto,
      examples: {
        textPost: {
          summary: 'Post de texto',
          value: {
            content: 'Este es mi primer post en la plataforma',
            type: 'TEXT',
          },
        },
        imagePost: {
          summary: 'Post con imagen',
          value: {
            content: 'Mira esta increíble foto',
            type: 'IMAGE',
            mediaURL: 'https://example.com/images/photo.jpg',
          },
        },
        videoPost: {
          summary: 'Post con video',
          value: {
            content: 'Video tutorial increíble',
            type: 'VIDEO',
            mediaURL: 'https://example.com/videos/tutorial.mp4',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Post creado exitosamente',
      schema: {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          content: 'Este es mi primer post en la plataforma',
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
      status: 400,
      description: 'Datos de entrada inválidos',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado',
    }),
  );
}
