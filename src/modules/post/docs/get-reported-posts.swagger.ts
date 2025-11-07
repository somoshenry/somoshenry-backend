import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

export const GetReportedPostsDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Obtener publicaciones reportadas',
      description:
        'Devuelve una lista paginada de publicaciones que han sido reportadas por usuarios, con conteo de reportes y fecha del último reporte.',
    }),
    ApiQuery({ name: 'page', required: false, example: 1 }),
    ApiQuery({ name: 'limit', required: false, example: 10 }),
    ApiResponse({
      status: 200,
      description: 'Lista paginada de publicaciones reportadas',
      schema: {
        example: {
          data: [
            {
              id: 'uuid-post',
              content: 'Contenido del post reportado...',
              createdAt: '2025-11-04T00:00:00.000Z',
              user: { id: 'uuid-user', name: 'Valentín' },
              reportsCount: 5,
              lastReportAt: '2025-11-03T22:10:15.000Z',
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      },
    }),
  );
