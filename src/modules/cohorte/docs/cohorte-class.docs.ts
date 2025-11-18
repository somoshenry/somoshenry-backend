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

export const CohorteClassDocs = {
  // GLOBAL

  tag: () => ApiTags('Cohorte Classes'),
  auth: () => ApiBearerAuth(),

  // CREATE CLASS

  create: {
    summary: () =>
      ApiOperation({ summary: 'Crear una clase (Admin o Teacher)' }),
    created: () =>
      ApiCreatedResponse({ description: 'Clase creada correctamente' }),
    badRequest: () => ApiBadRequestResponse({ description: 'Datos inválidos' }),
  },

  // FIND ALL CLASSES

  findAll: {
    summary: () =>
      ApiOperation({ summary: 'Listar todas las clases del sistema' }),
    ok: () => ApiOkResponse({ description: 'Clases obtenidas correctamente' }),
  },

  // FIND ONE CLASS

  findOne: {
    summary: () => ApiOperation({ summary: 'Obtener clase por ID' }),
    ok: () => ApiOkResponse({ description: 'Clase encontrada correctamente' }),
    notFound: () => ApiNotFoundResponse({ description: 'Clase no encontrada' }),
  },

  // UPDATE CLASS

  update: {
    summary: () =>
      ApiOperation({ summary: 'Actualizar clase (Admin o Teacher)' }),
    ok: () => ApiOkResponse({ description: 'Clase actualizada correctamente' }),
    badRequest: () => ApiBadRequestResponse({ description: 'Datos inválidos' }),
    notFound: () => ApiNotFoundResponse({ description: 'Clase no encontrada' }),
  },

  // REMOVE CLASS

  remove: {
    summary: () => ApiOperation({ summary: 'Eliminar clase (solo Admin)' }),
    noContent: () =>
      ApiNoContentResponse({ description: 'Clase eliminada correctamente' }),
    notFound: () => ApiNotFoundResponse({ description: 'Clase no encontrada' }),
  },

  // ATTENDANCE (MARK, GET CLASS, GET STUDENT)

  attendance: {
    // MARCAR ASISTENCIA MASIVA
    markSummary: () =>
      ApiOperation({
        summary:
          'Registrar asistencia masiva (TA para STAND_UP / Teacher para HANDS_ON)',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Asistencia registrada correctamente',
      }),
    badRequest: () => ApiBadRequestResponse({ description: 'Datos inválidos' }),
    forbidden: () =>
      ApiForbiddenResponse({
        description: 'No tienes permiso para registrar esta asistencia',
      }),

    // OBTENER ASISTENCIA DE LA CLASE
    classSummary: () =>
      ApiOperation({
        summary: 'Obtener asistencia completa de una clase',
      }),
    classOk: () =>
      ApiOkResponse({ description: 'Asistencia obtenida correctamente' }),
    notFound: () => ApiNotFoundResponse({ description: 'Clase no encontrada' }),

    // OBTENER ASISTENCIA DEL ALUMNO EN UN COHORTE
    studentSummary: () =>
      ApiOperation({
        summary: 'Obtener la asistencia de un alumno dentro de un cohorte',
      }),
  },
};
