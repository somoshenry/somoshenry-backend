import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function MarkAllReadDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Marca todas las notificaciones como leídas' }),
    ApiResponse({
      status: 200,
      description: 'Todas las notificaciones marcadas como leídas',
    }),
  );
}
