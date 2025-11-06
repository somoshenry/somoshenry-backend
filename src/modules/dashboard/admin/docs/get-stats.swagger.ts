import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';

export function GetAdminStatsDocs() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener estadísticas generales del panel de administración',
      description:
        'Devuelve métricas globales sobre usuarios, publicaciones, comentarios, reportes e interacciones para el panel de control del administrador.',
    }),
    ApiOkResponse({
      description: 'Estadísticas obtenidas correctamente.',
      schema: {
        example: {
          usersTotal: 152,
          usersActive30d: 85,
          usersNew30d: 12,
          bannedUsers: 3,
          postsTotal: 340,
          postsNew30d: 27,
          commentsTotal: 982,
          postsReportedPending: 6,
          commentsReportedPending: 2,
          pendingReportsTotal: 8,
          reportsResolved: 18,
          postsFlagged: 5,
          likesTotal: 1450,
          dislikesTotal: 80,
          viewsTotal: 22400,
          trend: { users: -1, posts: -1, comments: -1 },
        },
      },
    }),
  );
}
