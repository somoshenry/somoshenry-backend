import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AnnouncementResponseDto } from './announcement-response';
import { CreateAnnouncementRequestDto } from './announcement-request';

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
    body: () => ApiBody({ type: CreateAnnouncementRequestDto }),
    created: () =>
      ApiCreatedResponse({
        description: 'Anuncio creado exitosamente',
        type: AnnouncementResponseDto,
      }),
    badRequest: () =>
      ApiBadRequestResponse({
        description: 'Datos inválidos. Verifique el título y contenido.',
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
    forbidden: () =>
      ApiForbiddenResponse({
        description: 'No tiene permisos para crear anuncios en esta cohorte',
        schema: {
          example: {
            statusCode: 403,
            message: 'Forbidden',
            error: 'Insufficient permissions',
          },
        },
      }),
  },

  findAll: {
    summary: () =>
      ApiOperation({
        summary: 'Obtener todos los anuncios de una cohorte',
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
        description: 'Lista de anuncios obtenida exitosamente',
        type: [AnnouncementResponseDto],
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'Cohorte no encontrada',
        schema: {
          example: {
            statusCode: 404,
            message: 'Cohorte no encontrada',
            error: 'Not Found',
          },
        },
      }),
  },

  remove: {
    summary: () =>
      ApiOperation({
        summary: 'Eliminar un anuncio',
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
        description: 'Anuncio eliminado exitosamente',
      }),
    forbidden: () =>
      ApiForbiddenResponse({
        description: 'No tiene permisos para eliminar este anuncio',
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
        summary: 'Fijar o desfijar un anuncio',
        description:
          'Fija un anuncio al principio de la lista o lo desfiaja. Solo profesores y administradores pueden hacer esto.',
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
        description: 'Anuncio fijado o desfijado exitosamente',
        type: AnnouncementResponseDto,
      }),
    forbidden: () =>
      ApiForbiddenResponse({
        description: 'No tiene permisos para fijar anuncios',
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
