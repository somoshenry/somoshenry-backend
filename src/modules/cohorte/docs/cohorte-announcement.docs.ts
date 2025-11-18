import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

export const AnnouncementDocs = {
  tag: () => ApiTags('Anuncios de Cohorte'),
  auth: () => ApiBearerAuth(),

  create: {
    summary: () =>
      ApiOperation({
        summary: 'Crear anuncio en la cohorte',
        description:
          'Crea un nuevo anuncio visible para todos los miembros de la cohorte. Solo administradores y profesores pueden crear anuncios.',
        operationId: 'createAnnouncement',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID de la cohorte',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    body: () =>
      ApiBody({
        description: 'Datos para crear el anuncio',
        schema: {
          example: {
            title: 'Recordatorio importante',
            content: 'Mañana tenemos clase a las 18:00',
          },
        },
      }),
    created: () =>
      ApiCreatedResponse({
        description: 'Anuncio creado correctamente',
        schema: {
          example: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Recordatorio importante',
            content: 'Mañana tenemos clase a las 18:00',
            cohorteId: '550e8400-e29b-41d4-a716-446655440001',
            author: {
              id: '550e8400-e29b-41d4-a716-446655440002',
              fullName: 'Juan Pérez',
              email: 'juan.perez@example.com',
              role: 'TEACHER',
            },
            pinned: false,
            createdAt: '2025-01-15T10:30:00Z',
            updatedAt: '2025-01-15T10:30:00Z',
          },
        },
      }),
    forbidden: () =>
      ApiForbiddenResponse({
        description: 'No autorizado para publicar',
        schema: {
          example: {
            statusCode: 403,
            message: 'Forbidden',
            error: 'Insufficient permissions',
          },
        },
      }),
    badRequest: () =>
      ApiBadRequestResponse({
        description: 'Datos inválidos',
        schema: {
          example: {
            statusCode: 400,
            message: [
              'title must be longer than or equal to 3 characters',
              'content must be a string',
            ],
            error: 'Bad Request',
          },
        },
      }),
  },

  findAll: {
    summary: () =>
      ApiOperation({
        summary: 'Listar todos los anuncios de un cohorte',
        description:
          'Retorna la lista de anuncios ordenados por pinned primero, luego por fecha de creación descendente.',
        operationId: 'getCohorteAnnouncements',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID de la cohorte',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Lista de anuncios devuelta correctamente',
        schema: {
          example: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              title: 'Anuncio importante',
              content: 'Contenido del anuncio',
              cohorteId: '550e8400-e29b-41d4-a716-446655440001',
              author: {
                id: '550e8400-e29b-41d4-a716-446655440002',
                fullName: 'Juan Pérez',
                email: 'juan@example.com',
                role: 'TEACHER',
              },
              pinned: true,
              createdAt: '2025-01-15T10:30:00Z',
              updatedAt: '2025-01-15T10:30:00Z',
            },
          ],
        },
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'Cohorte no encontrado',
        schema: {
          example: {
            statusCode: 404,
            message: 'Cohorte no encontrado',
            error: 'Not Found',
          },
        },
      }),
  },

  remove: {
    summary: () =>
      ApiOperation({
        summary: 'Eliminar un anuncio propio (Teacher/Admin)',
        description:
          'Elimina un anuncio. Solo el creador o un administrador puede eliminar anuncios.',
        operationId: 'removeAnnouncement',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID del anuncio',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    noContent: () =>
      ApiNoContentResponse({
        description: 'Anuncio eliminado correctamente',
      }),
    forbidden: () =>
      ApiForbiddenResponse({
        description: 'No puedes eliminar anuncios de otros',
        schema: {
          example: {
            statusCode: 403,
            message: 'Forbidden',
            error: 'Only the creator or admin can delete',
          },
        },
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'Anuncio no encontrado',
        schema: {
          example: {
            statusCode: 404,
            message: 'Anuncio no encontrado',
            error: 'Not Found',
          },
        },
      }),
  },

  pin: {
    summary: () =>
      ApiOperation({
        summary: 'Fijar o desfijar un anuncio (Teacher/Admin)',
        description: 'Fija un anuncio al principio de la lista o lo desfiaja.',
        operationId: 'togglePinAnnouncement',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID del anuncio',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Anuncio actualizado correctamente',
        schema: {
          example: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Anuncio importante',
            content: 'Contenido del anuncio',
            cohorteId: '550e8400-e29b-41d4-a716-446655440001',
            author: {
              id: '550e8400-e29b-41d4-a716-446655440002',
              fullName: 'Juan Pérez',
              email: 'juan@example.com',
              role: 'TEACHER',
            },
            pinned: true,
            createdAt: '2025-01-15T10:30:00Z',
            updatedAt: '2025-01-15T10:30:00Z',
          },
        },
      }),
    forbidden: () =>
      ApiForbiddenResponse({
        description: 'No puedes fijar un anuncio ajeno',
        schema: {
          example: {
            statusCode: 403,
            message: 'Forbidden',
            error: 'Only teacher and admin can pin',
          },
        },
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'Anuncio no encontrado',
        schema: {
          example: {
            statusCode: 404,
            message: 'Anuncio no encontrado',
            error: 'Not Found',
          },
        },
      }),
  },
};
