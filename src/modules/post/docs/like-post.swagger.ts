import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function LikePostDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Dar like a una publicación',
      description:
        'Permite al usuario autenticado dar like a una publicación específica. Solo se permite un like por usuario.',
    }),
    ApiResponse({
      status: 201,
      description: 'Like agregado correctamente',
      schema: {
        example: {
          message: 'Like agregado correctamente',
          likeCount: 7,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'El usuario ya dio like a esta publicación',
    }),
    ApiResponse({
      status: 404,
      description: 'Publicación no encontrada',
    }),
  );
}

export function UnlikePostDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Quitar like de una publicación',
      description:
        'Permite al usuario autenticado eliminar su like de una publicación que haya likeado previamente.',
    }),
    ApiResponse({
      status: 200,
      description: 'Like eliminado correctamente',
      schema: {
        example: {
          message: 'Like eliminado correctamente',
          likeCount: 6,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'No diste like a esta publicación',
    }),
  );
}

export function GetLikesCountDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener cantidad de likes',
      description:
        'Devuelve la cantidad total de likes que tiene una publicación.',
    }),
    ApiResponse({
      status: 200,
      description: 'Cantidad de likes obtenida correctamente',
      schema: {
        example: {
          postId: 'a1b2c3d4',
          likeCount: 6,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Publicación no encontrada',
    }),
  );
}
