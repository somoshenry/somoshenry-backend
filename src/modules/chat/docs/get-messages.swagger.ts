import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

export function GetMessagesDocs() {
  return applyDecorators(
    ApiTags('Chat'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener los mensajes de una conversación con paginación',
    }),
    ApiResponse({
      status: 200,
      description: 'Mensajes devueltos correctamente',
    }),
    ApiResponse({ status: 404, description: 'Conversación no encontrada' }),
  );
}
