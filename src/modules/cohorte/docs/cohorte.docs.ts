// src/modules/cohorte/docs/cohorte.docs.ts

import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

export const CohorteDocs = {
  tag: () => ApiTags('Cohortes'),
  auth: () => ApiBearerAuth(),

  create: {
    summary: () => ApiOperation({ summary: 'Crear un cohorte (solo Admin)' }),
    created: () =>
      ApiCreatedResponse({ description: 'Cohorte creado correctamente' }),
    badRequest: () => ApiBadRequestResponse({ description: 'Datos inválidos' }),
  },

  findAll: {
    summary: () => ApiOperation({ summary: 'Listar todos los cohortes' }),
    ok: () =>
      ApiOkResponse({
        description: 'Lista de cohortes devuelta correctamente',
      }),
  },

  findOne: {
    summary: () => ApiOperation({ summary: 'Obtener un cohorte por ID' }),
    ok: () => ApiOkResponse({ description: 'Cohorte encontrado' }),
    notFound: () =>
      ApiNotFoundResponse({ description: 'Cohorte no encontrado' }),
  },

  update: {
    summary: () => ApiOperation({ summary: 'Actualizar un cohorte' }),
    ok: () =>
      ApiOkResponse({ description: 'Cohorte actualizado correctamente' }),
    badRequest: () => ApiBadRequestResponse({ description: 'Datos inválidos' }),
    notFound: () =>
      ApiNotFoundResponse({ description: 'Cohorte no encontrado' }),
  },

  remove: {
    summary: () => ApiOperation({ summary: 'Eliminar un cohorte' }),
    noContent: () =>
      ApiNoContentResponse({ description: 'Cohorte eliminado correctamente' }),
    notFound: () =>
      ApiNotFoundResponse({ description: 'Cohorte no encontrado' }),
  },

  members: {
    addSummary: () =>
      ApiOperation({ summary: 'Agregar un usuario a un cohorte' }),
    removeSummary: () =>
      ApiOperation({ summary: 'Eliminar un usuario de un cohorte' }),
    created: () =>
      ApiCreatedResponse({ description: 'Miembro agregado correctamente' }),
    noContent: () =>
      ApiNoContentResponse({ description: 'Miembro eliminado correctamente' }),
    notFound: () =>
      ApiNotFoundResponse({ description: 'Cohorte o usuario no encontrado' }),
  },
};
