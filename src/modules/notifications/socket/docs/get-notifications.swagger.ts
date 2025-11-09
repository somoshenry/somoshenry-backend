import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function GetNotificationsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtiene todas las notificaciones del usuario autenticado',
    }),
    ApiResponse({ status: 200, description: 'Listado de notificaciones' }),
  );
}
