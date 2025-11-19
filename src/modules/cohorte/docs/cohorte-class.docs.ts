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
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

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
    body: () =>
      ApiBody({
        description: 'Datos para crear la clase',
        schema: {
          example: {
            cohorteId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Introducción a TypeScript',
            description:
              'En esta clase aprenderemos los conceptos básicos de TypeScript',
            module: 'Fundamentos',
            scheduledDate: '2025-02-15T14:00:00Z',
            duration: 90,
            teacherId: '550e8400-e29b-41d4-a716-446655440001',
            meetingUrl: 'https://meet.google.com/abc-defg-hij',
            status: 'SCHEDULED',
          },
        },
      }),
    created: () =>
      ApiCreatedResponse({
        description: 'Clase creada correctamente',
        schema: {
          example: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            cohorteId: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Introducción a TypeScript',
            description:
              'En esta clase aprenderemos los conceptos básicos de TypeScript',
            module: 'Fundamentos',
            scheduledDate: '2025-02-15T14:00:00Z',
            duration: 90,
            teacher: {
              id: '550e8400-e29b-41d4-a716-446655440002',
              fullName: 'María García',
              email: 'maria.garcia@example.com',
            },
            meetingUrl: 'https://meet.google.com/abc-defg-hij',
            recordingUrl: null,
            materialsUrl: null,
            status: 'SCHEDULED',
            rtcRoomId: null,
            createdAt: '2025-01-15T10:30:00Z',
            updatedAt: '2025-01-15T10:30:00Z',
          },
        },
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
        summary: 'Listar todas las clases del sistema',
        description:
          'Retorna lista de todas las clases ordenadas por fecha programada de forma ascendente.',
        operationId: 'getAllClasses',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Clases obtenidas correctamente',
        schema: {
          example: [
            {
              id: '550e8400-e29b-41d4-a716-446655440000',
              cohorteId: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Introducción a TypeScript',
              description: 'Conceptos básicos',
              module: 'Fundamentos',
              scheduledDate: '2025-02-15T14:00:00Z',
              duration: 90,
              teacher: {
                id: '550e8400-e29b-41d4-a716-446655440002',
                fullName: 'María García',
                email: 'maria.garcia@example.com',
              },
              meetingUrl: 'https://meet.google.com/abc-defg-hij',
              recordingUrl: null,
              materialsUrl: null,
              status: 'SCHEDULED',
              rtcRoomId: null,
              createdAt: '2025-01-15T10:30:00Z',
              updatedAt: '2025-01-15T10:30:00Z',
            },
          ],
        },
      }),
  },

  findOne: {
    summary: () =>
      ApiOperation({
        summary: 'Obtener clase por ID',
        description: 'Obtiene los detalles completos de una clase.',
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
        description: 'Clase encontrada correctamente',
        schema: {
          example: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            cohorteId: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Introducción a TypeScript',
            description: 'Conceptos básicos',
            module: 'Fundamentos',
            scheduledDate: '2025-02-15T14:00:00Z',
            duration: 90,
            teacher: {
              id: '550e8400-e29b-41d4-a716-446655440002',
              fullName: 'María García',
              email: 'maria.garcia@example.com',
            },
            meetingUrl: 'https://meet.google.com/abc-defg-hij',
            recordingUrl: null,
            materialsUrl: null,
            status: 'SCHEDULED',
            rtcRoomId: null,
            createdAt: '2025-01-15T10:30:00Z',
            updatedAt: '2025-01-15T10:30:00Z',
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

  update: {
    summary: () =>
      ApiOperation({
        summary: 'Actualizar clase (Admin o Teacher)',
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
    body: () =>
      ApiBody({
        description: 'Datos para actualizar la clase',
        schema: {
          example: {
            name: 'Introducción a TypeScript - Actualizado',
            status: 'IN_PROGRESS',
            recordingUrl: 'https://drive.google.com/file/d/...',
          },
        },
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Clase actualizada correctamente',
        schema: {
          example: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            cohorteId: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Introducción a TypeScript - Actualizado',
            description: 'Conceptos básicos',
            module: 'Fundamentos',
            scheduledDate: '2025-02-15T14:00:00Z',
            duration: 90,
            teacher: {
              id: '550e8400-e29b-41d4-a716-446655440002',
              fullName: 'María García',
              email: 'maria.garcia@example.com',
            },
            meetingUrl: 'https://meet.google.com/abc-defg-hij',
            recordingUrl: 'https://drive.google.com/file/d/...',
            materialsUrl: null,
            status: 'IN_PROGRESS',
            rtcRoomId: null,
            createdAt: '2025-01-15T10:30:00Z',
            updatedAt: '2025-01-15T11:30:00Z',
          },
        },
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
        summary: 'Eliminar clase (solo Admin)',
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
        description: 'Clase eliminada correctamente',
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
        summary:
          'Registrar asistencia masiva (TA para STAND_UP / Teacher para HANDS_ON)',
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
    markBody: () =>
      ApiBody({
        description: 'Registros de asistencia a marcar',
        schema: {
          example: {
            type: 'STAND_UP',
            records: [
              {
                studentId: '550e8400-e29b-41d4-a716-446655440001',
                status: 'PRESENT',
                notes: 'Presente',
              },
              {
                studentId: '550e8400-e29b-41d4-a716-446655440002',
                status: 'ABSENT',
                notes: 'Justificado',
              },
            ],
          },
        },
      }),

    classSummary: () =>
      ApiOperation({
        summary: 'Obtener asistencia completa de una clase',
        description:
          'Retorna los registros de asistencia de una clase específica con detalle de cada estudiante.',
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
        summary: 'Obtener la asistencia de un alumno dentro de un cohorte',
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
        schema: {
          example: {
            message: 'Asistencia registrada correctamente',
            count: 25,
          },
        },
      }),
    classOk: () =>
      ApiOkResponse({
        description: 'Asistencia obtenida correctamente',
        schema: {
          example: {
            classId: '550e8400-e29b-41d4-a716-446655440000',
            className: 'Introducción a TypeScript',
            scheduledDate: '2025-02-15T14:00:00Z',
            totalRecords: 25,
            attendance: [
              {
                studentId: '550e8400-e29b-41d4-a716-446655440001',
                studentName: 'Carlos López',
                status: 'PRESENT',
                notes: 'Presente',
              },
              {
                studentId: '550e8400-e29b-41d4-a716-446655440002',
                studentName: 'Ana Martínez',
                status: 'ABSENT',
                notes: 'Justificado',
              },
            ],
          },
        },
      }),
    studentOk: () =>
      ApiOkResponse({
        description: 'Asistencia obtenida correctamente',
        schema: {
          example: {
            studentId: '550e8400-e29b-41d4-a716-446655440001',
            studentName: 'Carlos López',
            cohorteId: '550e8400-e29b-41d4-a716-446655440000',
            attendancePercentage: 92.5,
            classesAttended: 37,
            classesLate: 3,
            classesAbsent: 2,
            classesExcused: 1,
            totalClasses: 40,
          },
        },
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
        description: 'No tienes permiso para registrar esta asistencia',
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
};
