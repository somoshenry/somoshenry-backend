import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

export function MarkAsReadDocs() {
  return applyDecorators(
    ApiTags('Chat'),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Marcar un mensaje como leído' }),
    ApiResponse({
      status: 200,
      description: 'Mensaje marcado como leído correctamente',
    }),
    ApiResponse({ status: 404, description: 'Mensaje no encontrado' }),
  );
}
