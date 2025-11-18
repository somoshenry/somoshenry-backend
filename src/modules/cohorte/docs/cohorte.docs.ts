import { applyDecorators } from '@nestjs/common';

import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CohorteResponseDto } from './responses/cohorte-response';
import { CohorteWithMembersResponseDto } from './responses/cohorte-with-members-response';
import { CohortememberResponseDto } from './responses/cohortemember-response';
import { CreateCohorteRequestDto } from './requests/create-cohorte-request';
import { UpdateCohorteRequestDto } from './requests/update-cohorte-request';
import { AddMemberRequestDto } from './requests/add-member-request';

export const CohorteDocs = {
  tag: () => ApiTags('Cohortes'),
  auth: () => ApiBearerAuth(),

  create: {
    summary: () =>
      ApiOperation({
        summary: 'Crear una nueva cohorte',
        description:
          'Permite al administrador crear una nueva cohorte con los parámetros especificados. Requiere rol de administrador.',
      }),
    body: () => ApiBody({ type: CreateCohorteRequestDto }),
    created: () =>
      ApiCreatedResponse({
        description: 'Cohorte creada exitosamente',
        type: CohorteResponseDto,
      }),
    badRequest: () =>
      ApiBadRequestResponse({
        description:
          'Solicitud inválida. Verifique que todos los campos requeridos estén presentes y tengan el formato correcto.',
        schema: {
          example: {
            statusCode: 400,
            message: [
              'name should not be empty',
              'name must be a string',
              'name must be shorter than or equal to 100 characters',
            ],
            error: 'Bad Request',
          },
        },
      }),
  },

  findAll: {
    summary: () =>
      ApiOperation({
        summary: 'Obtener todas las cohortes',
        description:
          'Retorna una lista de todas las cohortes con información de miembros y clases relacionadas.',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Lista de cohortes obtenida exitosamente',
        type: [CohorteWithMembersResponseDto],
      }),
  },

  findOne: {
    summary: () =>
      ApiOperation({
        summary: 'Obtener una cohorte por ID',
        description:
          'Obtiene los detalles completos de una cohorte específica incluyendo miembros y clases.',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'Identificador único de la cohorte',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ok: () =>
      ApiOkResponse({
        description: 'Cohorte encontrada y retornada exitosamente',
        type: CohorteWithMembersResponseDto,
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'No existe una cohorte con el ID especificado',
        schema: {
          example: {
            statusCode: 404,
            message: 'Cohorte no encontrada',
            error: 'Not Found',
          },
        },
      }),
  },

  update: {
    summary: () =>
      ApiOperation({
        summary: 'Actualizar una cohorte',
        description:
          'Permite actualizar los campos de una cohorte existente. Requiere rol de administrador. Todos los campos son opcionales.',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'Identificador único de la cohorte a actualizar',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    body: () => ApiBody({ type: UpdateCohorteRequestDto }),
    ok: () =>
      ApiOkResponse({
        description: 'Cohorte actualizada exitosamente',
        type: CohorteResponseDto,
      }),
    badRequest: () =>
      ApiBadRequestResponse({
        description:
          'Solicitud inválida. Verifique los tipos de datos de los campos enviados.',
        schema: {
          example: {
            statusCode: 400,
            message: [
              'modality must be one of the following values: FULL_TIME, PART_TIME',
            ],
            error: 'Bad Request',
          },
        },
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'No existe una cohorte con el ID especificado',
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
        summary: 'Eliminar una cohorte',
        description:
          'Elimina una cohorte existente. Esta acción es irreversible. Requiere rol de administrador.',
      }),
    param: () =>
      ApiParam({
        name: 'id',
        type: 'string',
        format: 'uuid',
        description: 'Identificador único de la cohorte a eliminar',
        example: '550e8400-e29b-41d4-a716-446655440000',
      }),
    noContent: () =>
      ApiNoContentResponse({
        description: 'Cohorte eliminada exitosamente',
      }),
    notFound: () =>
      ApiNotFoundResponse({
        description: 'No existe una cohorte con el ID especificado',
        schema: {
          example: {
            statusCode: 404,
            message: 'Cohorte no encontrada',
            error: 'Not Found',
          },
        },
      }),
  },

  members: {
    addSummary: () =>
      ApiOperation({
        summary: 'Agregar un usuario como miembro de la cohorte',
        description:
          'Añade un usuario a la cohorte con el rol especificado. Requiere rol de administrador. Un usuario no puede ser agregado dos veces a la misma cohorte.',
      }),
    addParam: () =>
      [
        ApiParam({
          name: 'id',
          type: 'string',
          format: 'uuid',
          description: 'Identificador único de la cohorte',
          example: '550e8400-e29b-41d4-a716-446655440000',
        }),
        ApiParam({
          name: 'userId',
          type: 'string',
          format: 'uuid',
          description: 'Identificador único del usuario a agregar',
          example: '550e8400-e29b-41d4-a716-446655440001',
        }),
      ] as any,
    addBody: () => ApiBody({ type: AddMemberRequestDto }),
    created: () =>
      ApiCreatedResponse({
        description: 'Miembro agregado a la cohorte exitosamente',
        type: CohortememberResponseDto,
      }),
    memberNotFound: () =>
      ApiNotFoundResponse({
        description: 'La cohorte o el usuario especificado no existe',
        schema: {
          example: {
            statusCode: 404,
            message: 'Usuario no encontrado',
            error: 'Not Found',
          },
        },
      }),
    memberAlreadyExists: () =>
      ApiBadRequestResponse({
        description: 'El usuario ya es miembro de esta cohorte',
        schema: {
          example: {
            statusCode: 400,
            message: 'El usuario ya pertenece a la cohorte',
            error: 'Bad Request',
          },
        },
      }),

    removeSummary: () =>
      ApiOperation({
        summary: 'Eliminar un usuario de la cohorte',
        description:
          'Remueve un miembro de la cohorte. Requiere rol de administrador.',
      }),
    removeParam: () =>
      [
        ApiParam({
          name: 'id',
          type: 'string',
          format: 'uuid',
          description: 'Identificador único de la cohorte',
          example: '550e8400-e29b-41d4-a716-446655440000',
        }),
        ApiParam({
          name: 'userId',
          type: 'string',
          format: 'uuid',
          description: 'Identificador único del usuario a remover',
          example: '550e8400-e29b-41d4-a716-446655440001',
        }),
      ] as any,
    noContent: () =>
      ApiNoContentResponse({
        description: 'Miembro eliminado de la cohorte exitosamente',
      }),
    memberRemoveNotFound: () =>
      ApiNotFoundResponse({
        description: 'El miembro especificado no existe en la cohorte',
        schema: {
          example: {
            statusCode: 404,
            message: 'Miembro no encontrado',
            error: 'Not Found',
          },
        },
      }),
  },
};

// ============================================
// MIS COHORTES (TODAS)
// ============================================
export function ApiGetMyCohortes() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener mis cohortes',
      description:
        'Retorna todos los cohortes donde estoy inscrito (como profesor, estudiante o TA). Incluye cohortes activos e inactivos.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de cohortes obtenida exitosamente',
      schema: {
        example: [
          {
            cohorte: {
              id: 'abc-123',
              name: 'FT-50',
              description: 'Cohorte Full Time 50',
              startDate: '2025-01-15',
              endDate: null,
              status: 'ACTIVE',
              schedule: 'Lunes a Viernes 19:00-22:00',
              modality: 'FULL_TIME',
            },
            myRole: 'STUDENT',
            myStatus: 'ACTIVE',
            joinedAt: '2025-01-15T10:00:00.000Z',
            attendance: 95.5,
            finalGrade: null,
          },
          {
            cohorte: {
              id: 'def-456',
              name: 'PT-23',
              description: 'Cohorte Part Time 23',
              startDate: '2024-11-01',
              endDate: '2025-03-01',
              status: 'COMPLETED',
              schedule: 'Martes y Jueves 19:00-21:00',
              modality: 'PART_TIME',
            },
            myRole: 'STUDENT',
            myStatus: 'GRADUATED',
            joinedAt: '2024-11-01T10:00:00.000Z',
            attendance: 92.0,
            finalGrade: 9.5,
          },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}

// ============================================
// MIS COHORTES COMO PROFESOR
// ============================================
export function ApiGetMyCohorteAsTeacher() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener mis cohortes como profesor',
      description:
        'Retorna solo los cohortes donde soy profesor activo. Útil para profesores que necesitan ver únicamente sus cohortes asignados.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de cohortes donde soy profesor',
      schema: {
        example: [
          {
            cohorte: {
              id: 'abc-123',
              name: 'FT-50',
              description: 'Cohorte Full Time 50',
              startDate: '2025-01-15',
              endDate: null,
              status: 'ACTIVE',
              schedule: 'Lunes a Viernes 19:00-22:00',
              modality: 'FULL_TIME',
            },
            myRole: 'TEACHER',
            joinedAt: '2025-01-10T10:00:00.000Z',
          },
          {
            cohorte: {
              id: 'xyz-789',
              name: 'FT-51',
              description: 'Cohorte Full Time 51',
              startDate: '2025-02-01',
              endDate: null,
              status: 'UPCOMING',
              schedule: 'Lunes a Viernes 19:00-22:00',
              modality: 'FULL_TIME',
            },
            myRole: 'TEACHER',
            joinedAt: '2025-01-20T10:00:00.000Z',
          },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}

// ============================================
// MIS COHORTES COMO ESTUDIANTE
// ============================================
export function ApiGetMyCohortesAsStudent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener mis cohortes como estudiante',
      description:
        'Retorna solo los cohortes donde soy estudiante activo. Incluye información de asistencia y nota final.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de cohortes donde soy estudiante',
      schema: {
        example: [
          {
            cohorte: {
              id: 'abc-123',
              name: 'FT-50',
              description: 'Cohorte Full Time 50',
              startDate: '2025-01-15',
              endDate: null,
              status: 'ACTIVE',
              schedule: 'Lunes a Viernes 19:00-22:00',
              modality: 'FULL_TIME',
            },
            myRole: 'STUDENT',
            joinedAt: '2025-01-15T10:00:00.000Z',
            attendance: 95.5,
            finalGrade: null,
          },
          {
            cohorte: {
              id: 'def-456',
              name: 'PT-22',
              description: 'Cohorte Part Time 22',
              startDate: '2024-09-01',
              endDate: '2025-01-15',
              status: 'COMPLETED',
              schedule: 'Martes y Jueves 19:00-21:00',
              modality: 'PART_TIME',
            },
            myRole: 'STUDENT',
            joinedAt: '2024-09-01T10:00:00.000Z',
            attendance: 88.0,
            finalGrade: 8.7,
          },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}
