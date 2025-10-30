import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GmailDataDto } from '../dto/gmail.data.dto';
import { GmailResponseDto } from '../dto/gmail.response.dto';



export const SwaggerGmailExamples = {

  sendEmailBody: {
    to: 'destinatario@ejemplo.com',
    subject: 'Confirmación de Pedido #12345',
    html: '<h1>¡Pedido Confirmado!</h1><p>Gracias por tu compra. Tu pedido **#12345** ha sido procesado.</p>',
  },

  sendEmailResponse: {
    dataId: '18b32e01b44b8b6e', // ID del mensaje en Gmail
    status: 'success',
  },
};


export const SwaggerGmailDocs = {
  sendMessage: [
    ApiOperation({
      summary: 'Envía un correo electrónico HTML utilizando la Gmail API.',
      description:
        'Acepta un destinatario, un asunto y contenido en formato **HTML** para enviar un correo estilizado. Retorna el ID único del mensaje si es exitoso.',
    }),
    ApiBody({
      type: GmailDataDto,
      description:
        'Datos necesarios para componer y enviar el correo electrónico.',
      schema: { example: SwaggerGmailExamples.sendEmailBody }, // Referencia el ejemplo de cuerpo
    }),
    ApiResponse({
      status: 201,
      description:
        'Correo electrónico enviado exitosamente. Retorna el ID del mensaje.',
      type: GmailResponseDto, // Referencia el DTO de respuesta
      schema: { example: SwaggerGmailExamples.sendEmailResponse }, // Referencia el ejemplo de respuesta
    }),
    ApiResponse({
      status: 400,
      description:
        'Datos de entrada inválidos (ej. DTO mal formado o HTML vacío).',
    }),
    ApiResponse({
      status: 500,
      description:
        'Error al contactar con la Gmail API, credenciales no válidas o error de formato.',
    }),
  ],
};
