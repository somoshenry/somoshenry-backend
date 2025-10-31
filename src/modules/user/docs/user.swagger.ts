import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';

export const SwaggerUserExamples = {
  createUserBody: {
    email: 'valen@henry.com',
    password: 'Password123',
    name: 'Valentín',
    lastName: 'Hernández',
    role: 'TEACHER',
    status: 'ACTIVE',
  },

  updateUserBody: {
    email: 'nuevo_valen@henry.com',
    password: 'NuevaPass123',
    name: 'Valentín D.',
    lastName: 'Hernández López',
    role: 'TEACHER',
    status: 'ACTIVE',
  },

  userResponse: {
    message: 'Usuario creado exitosamente',
    user: {
      id: '2f1a4c3b-7f9d-43a2-9bb1-dcefe1b6b123',
      email: 'valen@henry.com',
      name: 'Valentín',
      lastName: 'Hernández',
      role: 'TEACHER',
      status: 'ACTIVE',
      createdAt: '2025-10-27T15:45:00.000Z',
    },
  },
};

export const SwaggerUserDocs = {
  me: [
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Obtener el perfil del usuario autenticado',
      description:
        'Devuelve los datos del usuario autenticado basado en el token JWT.',
    }),
    ApiResponse({
      status: 200,
      description: 'Perfil del usuario autenticado',
      schema: { example: SwaggerUserExamples.userResponse },
    }),
    ApiResponse({
      status: 401,
      description: 'No autenticado - Token JWT faltante o inválido',
    }),
  ],
  create: [
    ApiOperation({
      summary: 'Crear un nuevo usuario',
      description:
        'Crea un nuevo usuario en la base de datos con los campos provistos. Los campos requeridos son: email, password, nombre y apellido.',
    }),
    ApiResponse({
      status: 201,
      description: 'Usuario creado exitosamente',
      schema: { example: SwaggerUserExamples.userResponse },
    }),
    ApiResponse({
      status: 400,
      description: 'Datos inválidos o faltantes',
    }),
  ],

  findAll: [
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Obtener todos los usuarios (solo docentes y administradores)',
      description:
        'Devuelve una lista paginada de usuarios activos (no eliminados). Se pueden aplicar filtros por nombre, tipo o estado. Requiere rol de DOCENTE o ADMINISTRADOR.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de usuarios obtenida correctamente',
      schema: {
        example: {
          message: 'Lista de usuarios obtenida correctamente',
          total: 1,
          users: [SwaggerUserExamples.userResponse.user],
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autenticado - Token JWT faltante o inválido',
    }),
  ],

  findOne: [
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Obtener un usuario por ID',
      description:
        'Devuelve los datos de un usuario específico mediante su identificador único (UUID).',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario encontrado',
      schema: { example: SwaggerUserExamples.userResponse },
    }),
    ApiResponse({
      status: 401,
      description: 'No autenticado - Token JWT faltante o inválido',
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
  ],

  update: [
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Actualizar un usuario existente (propietario o administrador)',
      description:
        'Permite modificar los campos de un usuario existente. Solo el propietario del perfil o un administrador pueden realizar esta operación. Solo los campos enviados en el cuerpo de la solicitud serán actualizados.',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario actualizado correctamente',
      schema: {
        example: {
          message: 'Usuario actualizado correctamente',
          user: {
            ...SwaggerUserExamples.userResponse.user,
            email: SwaggerUserExamples.updateUserBody.email,
            name: SwaggerUserExamples.updateUserBody.name,
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autenticado - Token JWT faltante o inválido',
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
  ],

  delete: [
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary:
        'Eliminar (soft delete) un usuario (propietario o administrador)',
      description:
        'Marca un usuario como eliminado sin borrarlo físicamente de la base de datos. Solo el propietario del perfil o un administrador pueden realizar esta operación. El campo `deletedAt` se completa y el estado pasa a `DELETED`.',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario marcado como eliminado',
      schema: {
        example: { message: 'Usuario marcado como eliminado (soft delete)' },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autenticado - Token JWT faltante o inválido',
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
  ],

  restore: [
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Restaurar un usuario eliminado (solo administradores)',
      description:
        'Restaura un usuario que fue previamente eliminado mediante soft delete, devolviéndolo al estado `ACTIVO`. Solo los administradores pueden realizar esta operación.',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario restaurado correctamente',
      schema: {
        example: { message: 'Usuario restaurado correctamente' },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autenticado - Token JWT faltante o inválido',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado o no eliminado',
    }),
  ],

  hardDelete: [
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Eliminar definitivamente un usuario (solo administradores)',
      description:
        'Elimina completamente al usuario de la base de datos. Esta acción no se puede deshacer y requiere rol de ADMINISTRADOR.',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario eliminado definitivamente de la base de datos',
      schema: {
        example: {
          message: 'Usuario eliminado definitivamente de la base de datos',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autenticado - Token JWT faltante o inválido',
    }),
    ApiResponse({
      status: 403,
      description: 'No tienes permisos para eliminar usuarios permanentemente',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado',
    }),
  ],
};
