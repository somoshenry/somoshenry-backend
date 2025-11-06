import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';

export function GetReportedPostsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listado de posts reportados',
      description:
        'Obtiene publicaciones con reportes pendientes, incluyendo autor, contenido, cantidad y fecha del último reporte.',
    }),
    ApiOkResponse({
      description: 'Lista paginada de posts reportados con metadatos.',
      schema: {
        example: {
          data: [
            {
              postId: '41f1fea8-0296-4cb7-9c1b-b302bde887d5',
              content: 'Este es un post reportado...',
              author: {
                id: '37f124f8-6883-4dd4-970c-75435a55a5a2',
                username: 'johnny_bendeja',
                name: 'Johnny Bendeja',
              },
              reportsCount: 3,
              lastReportAt: '2025-11-04T03:23:12.000Z',
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
