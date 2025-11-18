// src/modules/cohorte/docs/cohorte.docs.ts

import { applyDecorators } from '@nestjs/common';
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
  ApiResponse,
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
