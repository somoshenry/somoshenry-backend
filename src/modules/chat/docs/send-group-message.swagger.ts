import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SendGroupMessageDto } from '../dto/send-group-message.dto';

export function SendGroupMessageDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Enviar un mensaje a un grupo' }),
    ApiParam({
      name: 'groupId',
      required: true,
      description: 'UUID del grupo al que se envía el mensaje',
    }),
    ApiBody({
      type: SendGroupMessageDto,
      description: 'Datos del mensaje a enviar',
      examples: {
        texto: {
          summary: 'Mensaje de texto',
          value: {
            content: 'Hola grupo 👋',
            type: 'TEXT',
          },
        },
        imagen: {
          summary: 'Mensaje con imagen',
          value: {
            content: 'https://res.cloudinary.com/ejemplo/image/upload/foto.png',
            type: 'IMAGE',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Mensaje enviado correctamente',
    }),
    ApiResponse({
      status: 400,
      description: 'No perteneces al grupo o datos inválidos',
    }),
    ApiResponse({
      status: 404,
      description: 'Grupo no encontrado',
    }),
  );
}
