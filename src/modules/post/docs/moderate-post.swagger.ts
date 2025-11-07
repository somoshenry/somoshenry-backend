import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';

export const ModeratePostDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Marcar o desmarcar un post como inapropiado (solo ADMIN)',
    }),
    ApiParam({
      name: 'id',
      description: 'ID del post a moderar',
      required: true,
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          isInappropriate: {
            type: 'boolean',
            example: true,
            description:
              'Indica si el post se marca o se desmarca como inapropiado',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Estado de moderación actualizado',
    }),
  );
