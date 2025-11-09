import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiTags,
} from '@nestjs/swagger';
import { MessageType } from '../entities/message.entity';

export function SendMessageDocs() {
  return applyDecorators(
    ApiTags('Chat'),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Enviar un mensaje de texto o multimedia' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          conversationId: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: Object.values(MessageType) },
          content: { type: 'string' },
          mediaUrl: { type: 'string' },
        },
        required: ['conversationId', 'type'],
      },
    }),
    ApiResponse({ status: 201, description: 'Mensaje enviado correctamente' }),
    ApiResponse({
      status: 404,
      description: 'Conversación o usuario no encontrados',
    }),
  );
}
