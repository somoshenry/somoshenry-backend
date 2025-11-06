import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';

export function GetStatsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Estadísticas generales del panel de administración',
      description:
        'Devuelve métricas agregadas del sistema: usuarios, publicaciones, reportes y tendencias.',
    }),
    ApiOkResponse({
      description: 'Datos agregados para las cards principales del dashboard',
      schema: {
        example: {
          usersTotal: 1234,
          usersActive30d: 892,
          postsTotal: 3456,
          commentsTotal: 8912,
          postsReportedPending: 23,
          commentsReportedPending: 2,
          postsFlagged: 5,
          likesTotal: 12000,
          dislikesTotal: 350,
          viewsTotal: 54000,
          trend: { users: -1, posts: -1, comments: -1 },
        },
      },
    }),
  );
}
