import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function GetUserGroupsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener los grupos donde participa el usuario autenticado',
    }),
    ApiResponse({
      status: 200,
      description: 'Listado de grupos del usuario',
    }),
    ApiResponse({ status: 401, description: 'No autorizado' }),
  );
}
