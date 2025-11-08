import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function MarkAsReadDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Marca una notificación como leída' }),
    ApiResponse({
      status: 200,
      description: 'Notificación marcada como leída',
    }),
  );
}
