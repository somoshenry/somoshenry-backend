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
import {
  ClassResponseDto,
  ClassAttendanceResponseDto,
  StudentAttendanceResponseDto,
} from './class-response';
import { CreateClassRequestDto, UpdateClassRequestDto } from './class-request';
import { MarkAttendanceRequestDto } from './attendance-request';

export const CohorteClassDocs = {
  tag: () => ApiTags('Clases de Cohorte'),
  auth: () => ApiBearerAuth(),

  create: {
    summary: () =>
      ApiOperation({
        summary: 'Crear una nueva clase',
        description:
          'Crea una nueva clase en la cohorte. Solo profesores y administradores pueden crear clases.',
        operationId: 'createClass',
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
          'Retorna lista de todas las clases ordenadas por fecha programada de forma ascendente.',
        operationId: 'getAllClasses',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Lista de clases obtenida exitosamente',
        type: [ClassResponseDto],
      }),
  },

  // findAllbyCohort: {
  //   summary: () =>
  //     ApiOperation({
  //       summary: 'Obtener todas las clases de una cohorte',
  //       description:
  //         'Retorna todas las clases asociadas a una cohorte específica, ordenadas por fecha programada de forma ascendente.',
  //       operationId: 'getClassesByCohort',
  //     }),
  //   param: () =>
  //     ApiParam({
  //       name: 'cohorteId',
  //       type: 'string',
  //       format: 'uuid',
  //       description: 'ID de la cohorte',
  //       example: '550e8400-e29b-41d4-a716-446655440000',
  //     }),
  //   ok: () =>
  //     ApiOkResponse({
  //       description: 'Lista de clases de la cohorte obtenida exitosamente',
  //       type: [ClassResponseDto],
  //     }),
  //   notFound: () =>
  //     ApiNotFoundResponse({
  //       description: 'No se encontraron clases para la cohorte',
  //       schema: {
  //         example: {
  //           statusCode: 404,
  //           message:
  //             'No se encontraron clases para la cohorte 550e8400-e29b-41d4-a716-446655440000',
  //           error: 'Not Found',
  //         },
  //       },
  //     }),
  // },

  findOne: {
    summary: () =>
      ApiOperation({
        summary: 'Obtener una clase específica',
        description: 'Obtiene los detalles completos de una clase por su ID.',
        operationId: 'getClassById',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID de la clase',
        example: '550e8400-e29b-41d4-a716-446655440000',
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
        operationId: 'updateClass',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID de la clase',
        example: '550e8400-e29b-41d4-a716-446655440000',
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
        operationId: 'deleteClass',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID de la clase',
        example: '550e8400-e29b-41d4-a716-446655440000',
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
        summary: 'Registrar asistencia de una clase',
        description:
          'Registra la asistencia de múltiples estudiantes en una clase. Solo profesores y administradores pueden registrar asistencia.',
        operationId: 'markAttendance',
      }),
    markParam: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID de la clase',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    markBody: () => ApiBody({ type: MarkAttendanceRequestDto }),

    classSummary: () =>
      ApiOperation({
        summary: 'Obtener asistencia de una clase',
        description:
          'Retorna los registros de asistencia completos de una clase específica con detalle de cada estudiante.',
        operationId: 'getClassAttendance',
      }),
    classParam: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'ID de la clase',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),

    studentSummary: () =>
      ApiOperation({
        summary: 'Obtener asistencia de un estudiante en una cohorte',
        description:
          'Retorna el registro de asistencia agregado de un estudiante en todas las clases de una cohorte.',
        operationId: 'getStudentAttendance',
      }),
    studentCohorteParam: () =>
      ApiParam({
        name: 'cohorteId',
        type: 'string',
        format: 'uuid',
        description: 'ID de la cohorte',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    studentIdParam: () =>
      ApiParam({
        name: 'studentId',
        type: 'string',
        format: 'uuid',
        description: 'ID del estudiante',
        example: '550e8400-e29b-41d4-a716-446655440001',
      }),

    ok: () =>
      ApiOkResponse({
        description: 'Operación completada exitosamente',
      }),
    markOk: () =>
      ApiOkResponse({
        description: 'Asistencia registrada exitosamente',
        schema: {
          example: {
            message: 'Attendance recorded successfully',
            count: 25,
          },
        },
      }),
    classOk: () =>
      ApiOkResponse({
        description: 'Asistencia de la clase obtenida exitosamente',
        type: ClassAttendanceResponseDto,
      }),
    studentOk: () =>
      ApiOkResponse({
        description: 'Asistencia del estudiante obtenida exitosamente',
        type: StudentAttendanceResponseDto,
      }),

    badRequest: () =>
      ApiBadRequestResponse({
        description: 'Datos inválidos.',
        schema: {
          example: {
            statusCode: 400,
            message: [
              'records must be an array',
              'status must be one of: PRESENT, ABSENT, LATE, EXCUSED',
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
            error: 'Only teacher and admin can record attendance',
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
