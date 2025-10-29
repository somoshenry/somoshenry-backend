import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function GetPostsFeedDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Obtener feed principal paginado de posts' }),
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
      description: 'Cantidad de posts por página (por defecto: 10)',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Feed de posts obtenido exitosamente',
    }),
  );
}
