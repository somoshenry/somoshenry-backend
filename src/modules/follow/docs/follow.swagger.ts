import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const SwaggerFollowDocs = {
  seguir: [
    ApiOperation({
      summary: 'Seguir a un usuario',
      description: 'Permite que un usuario comience a seguir a otro.',
    }),
    ApiResponse({
      status: 201,
      description: 'Relación de seguimiento creada exitosamente.',
    }),
    ApiResponse({
      status: 400,
      description: 'Los IDs proporcionados no son válidos o ya existe la relación.',
    }),
  ],

  dejarDeSeguir: [
    ApiOperation({
      summary: 'Dejar de seguir a un usuario',
      description: 'Permite que un usuario deje de seguir a otro.',
    }),
    ApiResponse({
      status: 200,
      description: 'Relación de seguimiento eliminada correctamente.',
    }),
    ApiResponse({
      status: 404,
      description: 'No existe relación de seguimiento entre los usuarios.',
    }),
  ],

  obtenerSeguidores: [
    ApiOperation({
      summary: 'Obtener seguidores',
      description: 'Devuelve la lista de usuarios que siguen al usuario indicado.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de seguidores obtenida exitosamente.',
    }),
  ],

  obtenerSiguiendo: [
    ApiOperation({
      summary: 'Obtener seguidos',
      description: 'Devuelve la lista de usuarios que el usuario indicado está siguiendo.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de seguidos obtenida exitosamente.',
    }),
  ],

  contarSeguidores: [
    ApiOperation({
      summary: 'Contar seguidores',
      description: 'Devuelve la cantidad total de seguidores de un usuario.',
    }),
    ApiResponse({
      status: 200,
      description: 'Cantidad de seguidores obtenida exitosamente.',
    }),
  ],

  contarSiguiendo: [
    ApiOperation({
      summary: 'Contar seguidos',
      description: 'Devuelve la cantidad total de usuarios que el usuario indicado sigue.',
    }),
    ApiResponse({
      status: 200,
      description: 'Cantidad de seguidos obtenida exitosamente.',
    }),
  ],
};
