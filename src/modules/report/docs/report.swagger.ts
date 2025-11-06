import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportReason, ReportStatus } from '../entities/report.entity';

export const CreateReportDocs = applyDecorators(
  ApiOperation({
    summary: 'Crear un reporte de post o comentario (usuario autenticado)',
  }),
  ApiBody({
    schema: {
      example: {
        postId: '4f1afa08-0296-4cb7-9c1b-b320bde887d5',
        reason: ReportReason.SPAM,
        description: 'Este post contiene enlaces sospechosos.',
      },
    },
  }),
  ApiResponse({ status: 201, description: 'Reporte creado correctamente.' }),
  ApiResponse({ status: 400, description: 'Datos inválidos.' }),
);

export const GetPendingReportsDocs = applyDecorators(
  ApiOperation({
    summary: 'Listar todos los reportes pendientes (solo ADMIN)',
  }),
  ApiResponse({ status: 200, description: 'Lista de reportes pendientes.' }),
);

export const GetAllReportsDocs = applyDecorators(
  ApiOperation({
    summary: 'Listar todos los reportes filtrando por estado (solo ADMIN)',
  }),
  ApiQuery({
    name: 'status',
    required: false,
    enum: ReportStatus,
    description: 'Filtrar por estado (PENDING, REVIEWED, RESOLVED, DISMISSED)',
  }),
  ApiResponse({ status: 200, description: 'Lista de reportes filtrados.' }),
);

export const UpdateReportStatusDocs = applyDecorators(
  ApiOperation({
    summary: 'Actualizar el estado de un reporte (solo ADMIN)',
  }),
  ApiParam({ name: 'id', type: 'string', description: 'ID del reporte' }),
  ApiBody({
    schema: {
      example: { status: ReportStatus.RESOLVED },
    },
  }),
  ApiResponse({
    status: 200,
    description: 'Reporte actualizado correctamente.',
  }),
  ApiResponse({
    status: 403,
    description: 'Solo los administradores pueden revisar reportes.',
  }),
);
