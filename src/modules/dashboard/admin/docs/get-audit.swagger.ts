import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';

export function GetAuditDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Auditoría de actividad administrativa',
      description:
        'Devuelve la lista de administradores que revisaron reportes, con la cantidad de acciones realizadas y la fecha de su última revisión.',
    }),
    ApiOkResponse({
      description: 'Listado de revisores y métricas de auditoría',
      schema: {
        example: {
          data: [
            {
              reviewerId: 'a7f3b4d2-5f09-4d21-b08c-3a21df712eac',
              username: 'admin1',
              actionsCount: 42,
              lastActionAt: '2025-11-05T02:30:00.000Z',
            },
          ],
          meta: {
            total: 1,
            lastUpdated: '2025-11-05T02:35:00.000Z',
          },
        },
      },
    }),
  );
}
