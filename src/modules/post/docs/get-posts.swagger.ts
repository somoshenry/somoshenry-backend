import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PostType } from '../entities/post.entity';

export function GetPostsFeedDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener feed principal de posts con filtros y paginación',
      description:
        'Permite filtrar posts por tipo, búsqueda de texto, usuario, fechas, etc.',
    }),

    // Paginación
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número de página (por defecto: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description:
        'Cantidad de posts por página (por defecto: 20, máximo: 100)',
      example: 10,
    }),

    // Filtros de contenido
    ApiQuery({
      name: 'type',
      required: false,
      enum: PostType,
      description: 'Filtrar por tipo de post',
      example: PostType.IMAGE,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Buscar en el contenido del post (búsqueda de texto)',
      example: 'React',
    }),
    ApiQuery({
      name: 'userId',
      required: false,
      type: String,
      description: 'Filtrar posts de un usuario específico',
      example: 'user-uuid-123',
    }),

    // Filtros de fecha
    ApiQuery({
      name: 'dateFrom',
      required: false,
      type: String,
      description: 'Posts desde esta fecha (formato: YYYY-MM-DD)',
      example: '2025-01-01',
    }),
    ApiQuery({
      name: 'dateTo',
      required: false,
      type: String,
      description: 'Posts hasta esta fecha (formato: YYYY-MM-DD)',
      example: '2025-12-31',
    }),

    // Ordenamiento
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['createdAt', 'updatedAt'],
      description: 'Campo por el cual ordenar (por defecto: createdAt)',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'order',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Orden ascendente o descendente (por defecto: DESC)',
      example: 'DESC',
    }),

    // Respuestas
    ApiResponse({
      status: 200,
      description:
        'Feed de Posts obtenidos exitosamente con los filtros aplicados',
    }),
    ApiResponse({
      status: 400,
      description: 'Parámetros de filtrado inválidos',
    }),
  );
}
