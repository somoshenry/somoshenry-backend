import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateGroupDto } from '../dto/create-group.dto';

export function CreateGroupDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Crear un nuevo grupo de chat' }),
    ApiBody({
      type: CreateGroupDto,
      examples: {
        ejemplo: {
          summary: 'Ejemplo de body para crear grupo',
          value: {
            name: 'Equipo Backend',
            description: 'Canal para el equipo de desarrollo backend',
            imageUrl: 'https://res.cloudinary.com/demo/image/upload/team.png',
            memberIds: [
              '5dc3e94e-b4cf-4f08-a839-ff92d37f29e5',
              'c96b02db-6b89-4f9a-b5d5-8b7f469c6d89',
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Grupo creado correctamente',
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
              role: 'ADMIN',
            },
            {
              id: 'c96b02db-6b89-4f9a-b5d5-8b7f469c6d89',
              name: 'Andre',
              email: 'andre@example.com',
              role: 'MEMBER',
            },
          ],
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Datos inválidos' }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}
