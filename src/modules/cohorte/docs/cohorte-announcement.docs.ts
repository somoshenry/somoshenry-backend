// src/modules/cohorte/docs/cohorte-announcement.docs.ts

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
} from '@nestjs/swagger';

export const AnnouncementDocs = {
  tag: () => ApiTags('Cohorte Announcements'),
  auth: () => ApiBearerAuth(),

  create: {
    summary: () =>
      ApiOperation({
        summary: 'Crear anuncio para un cohorte (Teacher/Admin)',
      }),
    created: () =>
      ApiCreatedResponse({ description: 'Anuncio creado correctamente' }),
    forbidden: () =>
      ApiForbiddenResponse({ description: 'No autorizado para publicar' }),
    badRequest: () => ApiBadRequestResponse({ description: 'Datos inválidos' }),
  },

  findAll: {
    summary: () =>
      ApiOperation({ summary: 'Listar todos los anuncios de un cohorte' }),
    ok: () =>
      ApiOkResponse({
        description: 'Lista de anuncios devuelta correctamente',
      }),
    notFound: () =>
      ApiNotFoundResponse({ description: 'Cohorte no encontrado' }),
  },

  remove: {
    summary: () =>
      ApiOperation({ summary: 'Eliminar un anuncio propio (Teacher/Admin)' }),
    noContent: () =>
      ApiNoContentResponse({ description: 'Anuncio eliminado correctamente' }),
    forbidden: () =>
      ApiForbiddenResponse({
        description: 'No puedes eliminar anuncios de otros',
      }),
    notFound: () =>
      ApiNotFoundResponse({ description: 'Anuncio no encontrado' }),
  },

  pin: {
    summary: () =>
      ApiOperation({ summary: 'Fijar o desfijar un anuncio (Teacher/Admin)' }),
    ok: () =>
      ApiOkResponse({ description: 'Anuncio actualizado correctamente' }),
    forbidden: () =>
      ApiForbiddenResponse({ description: 'No puedes fijar un anuncio ajeno' }),
    notFound: () =>
      ApiNotFoundResponse({ description: 'Anuncio no encontrado' }),
  },
};
