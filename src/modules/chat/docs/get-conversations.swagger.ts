import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

export function GetConversationsDocs() {
  return applyDecorators(
    ApiTags('Chat'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Obtener todas las conversaciones del usuario autenticado',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de conversaciones devuelta correctamente',
    }),
  );
}
