import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiTags,
} from '@nestjs/swagger';

export function OpenConversationDocs() {
  return applyDecorators(
    ApiTags('Chat'),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Abrir o crear una conversación entre dos usuarios',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          peerUserId: { type: 'string', format: 'uuid' },
        },
        required: ['peerUserId'],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Conversación creada o existente devuelta',
    }),
    ApiResponse({
      status: 400,
      description: 'Intento de abrir chat consigo mismo',
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
  );
}
