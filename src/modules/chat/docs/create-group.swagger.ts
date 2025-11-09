import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateGroupDto } from '../dto/create-group.dto';

export function CreateGroupDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Crear un nuevo grupo de chat' }),
    ApiBody({ type: CreateGroupDto }),
    ApiResponse({
      status: 201,
      description: 'Grupo creado correctamente',
    }),
    ApiResponse({ status: 400, description: 'Datos inválidos' }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}
