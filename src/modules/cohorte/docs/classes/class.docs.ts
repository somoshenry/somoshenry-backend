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
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ClassResponseDto } from './class-response';
import { CreateClassRequestDto, UpdateClassRequestDto } from './class-request';

export const CohorteClassDocs = {
  tag: () => ApiTags('Clases de Cohorte'),
  auth: () => ApiBearerAuth(),

  create: {
    summary: () =>
      ApiOperation({
        summary: 'Crear una nueva clase',
        description:
          'Crea una nueva clase en la cohorte. Solo profesores y administradores pueden crear clases.',
      }),
    body: () => ApiBody({ type: CreateClassRequestDto }),
    created: () =>
      ApiCreatedResponse({
        description: 'Clase creada exitosamente',
        type: ClassResponseDto,
      }),
    badRequest: () =>
      ApiBadRequestResponse({
        description: 'Datos inválidos o cohorte no existe.',
        schema: {
          example: {
            statusCode: 400,
            message: [
              'cohorteId must be a UUID',
              'name must be shorter than or equal to 200 characters',
            ],
            error: 'Bad Request',
          },
        },
      }),
  },

  findAll: {
    summary: () =>
      ApiOperation({
        summary: 'Obtener todas las clases',
        description:
          'Retorna lista de todas las clases ordenadas por fecha programada.',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Lista de clases obtenida exitosamente',
        type: [ClassResponseDto],
      }),
  },

  findOne: {
    summary: () =>
      ApiOperation({
        summary: 'Obtener una clase específica',
        description: 'Obtiene los detalles completos de una clase.',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID de la clase',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Clase obtenida exitosamente',
        type: ClassResponseDto,
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'Clase no encontrada',
        schema: {
          example: {
            statusCode: 404,
            message: 'Clase no encontrada',
            error: 'Not Found',
          },
        },
      }),
  },

  update: {
    summary: () =>
      ApiOperation({
        summary: 'Actualizar una clase',
        description:
          'Actualiza los datos de una clase existente. Solo profesores y administradores pueden actualizar.',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID de la clase',
      }),
    body: () => ApiBody({ type: UpdateClassRequestDto }),
    ok: () =>
      ApiOkResponse({
        description: 'Clase actualizada exitosamente',
        type: ClassResponseDto,
      }),
    badRequest: () =>
      ApiBadRequestResponse({
        description: 'Datos inválidos.',
        schema: {
          example: {
            statusCode: 400,
            message: [
              'status must be one of the following values: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED',
            ],
            error: 'Bad Request',
          },
        },
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'Clase no encontrada',
        schema: {
          example: {
            statusCode: 404,
            message: 'Clase no encontrada',
            error: 'Not Found',
          },
        },
      }),
  },

  remove: {
    summary: () =>
      ApiOperation({
        summary: 'Eliminar una clase',
        description: 'Elimina una clase. Solo administradores pueden eliminar.',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID de la clase',
      }),
    noContent: () =>
      ApiNoContentResponse({
        description: 'Clase eliminada exitosamente',
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'Clase no encontrada',
        schema: {
          example: {
            statusCode: 404,
            message: 'Clase no encontrada',
            error: 'Not Found',
          },
        },
      }),
  },

  attendance: {
    markSummary: () =>
      ApiOperation({
        summary: 'Marcar asistencia de una clase',
        description:
          'Registra la asistencia de estudiantes en una clase. Solo profesores y administradores pueden registrar asistencia.',
      }),
    classSummary: () =>
      ApiOperation({
        summary: 'Obtener asistencia de una clase',
        description:
          'Retorna los registros de asistencia de una clase específica.',
      }),
    studentSummary: () =>
      ApiOperation({
        summary: 'Obtener asistencia de un estudiante en una cohorte',
        description:
          'Retorna el registro de asistencia de un estudiante en todas las clases de una cohorte.',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Operación completada exitosamente',
      }),
    badRequest: () =>
      ApiBadRequestResponse({
        description: 'Datos inválidos.',
        schema: {
          example: {
            statusCode: 400,
            message: [
              'status must be one of the following values: PRESENT, ABSENT, LATE, EXCUSED',
            ],
            error: 'Bad Request',
          },
        },
      }),
    forbidden: () =>
      ApiForbiddenResponse({
        description: 'No tiene permisos para realizar esta acción',
        schema: {
          example: {
            statusCode: 403,
            message: 'Forbidden',
          },
        },
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'Recurso no encontrado',
        schema: {
          example: {
            statusCode: 404,
            message: 'Clase no encontrada',
            error: 'Not Found',
          },
        },
      }),
  },
};
