import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function DeleteNotificationDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Elimina una notificación' }),
    ApiResponse({
      status: 200,
      description: 'Notificación eliminada correctamente',
    }),
  );
}
