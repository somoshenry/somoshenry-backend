import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';

export function GetReportedCommentsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listado de comentarios reportados',
      description:
        'Obtiene comentarios con reportes pendientes, incluyendo autor, contenido, cantidad de reportes y fecha del último reporte.',
    }),
    ApiOkResponse({
      description: 'Lista paginada de comentarios reportados con metadatos.',
      schema: {
        example: {
          data: [
            {
              commentId: '0c6c3cf7-22e4-4217-a5d1-8a6e42c7e31f',
              content: 'Este comentario contiene lenguaje inapropiado...',
              author: {
                id: 'bfa64a4e-41df-474d-a4a0-efb1f4a0a09c',
                name: 'Roberto Díaz',
              },
              reportsCount: 4,
              lastReportAt: '2025-11-02T03:23:12.000Z',
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
}
