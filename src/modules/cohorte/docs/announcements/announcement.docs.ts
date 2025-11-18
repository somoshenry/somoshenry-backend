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
          },
        },
      }),
  },

  findAll: {
    summary: () =>
      ApiOperation({
        summary: 'Obtener todos los anuncios de una cohorte',
        description:
          'Retorna la lista de anuncios ordenados por fecha de creación descendente.',
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
        summary: 'Fijar/Desfijar un anuncio',
        description:
          'Fija un anuncio al principio de la lista o lo desfiaja. Solo profesores y administradores pueden hacer esto.',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Anuncio fijado/desfijado exitosamente',
        type: AnnouncementResponseDto,
      }),
    forbidden: () =>
      ApiForbiddenResponse({
        description: 'No tiene permisos para fijar anuncios',
        schema: {
          example: {
            statusCode: 403,
            message: 'Forbidden',
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
