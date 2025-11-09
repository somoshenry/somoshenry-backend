import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function CreateNotificationDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Crea una nueva notificación' }),
    ApiResponse({
      status: 201,
      description: 'Notificación creada correctamente',
    }),
  );
}
