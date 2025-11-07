import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiTags,
} from '@nestjs/swagger';

export function UploadMediaDocs() {
  return applyDecorators(
    ApiTags('Chat'),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Subir imagen, audio, video o archivo al chat' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: { type: 'string', format: 'binary' },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Archivo subido correctamente' }),
    ApiResponse({ status: 400, description: 'Error al subir archivo' }),
  );
}
