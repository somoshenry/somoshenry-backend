import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const SwaggerUserExamples = {
  createUserBody: {
    email: 'valen@henry.com',
    password: 'Password123',
    nombre: 'Valentín',
    apellido: 'Hernández',
    tipo: 'DOCENTE',
    estado: 'ACTIVO',
  },

  updateUserBody: {
    email: 'nuevo_valen@henry.com',
    password: 'NuevaPass123',
    nombre: 'Valentín D.',
    apellido: 'Hernández López',
    tipo: 'MENTOR',
    estado: 'ACTIVO',
  },

  userResponse: {
    message: 'Usuario creado exitosamente',
    user: {
      id: '2f1a4c3b-7f9d-43a2-9bb1-dcefe1b6b123',
      email: 'valen@henry.com',
      nombre: 'Valentín',
      apellido: 'Hernández',
      tipo: 'DOCENTE',
      estado: 'ACTIVO',
      creadoEn: '2025-10-27T15:45:00.000Z',
    },
  },
};

export const SwaggerUserDocs = {

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
    ApiOperation({
      summary: 'Obtener todos los usuarios',
      description:
        'Devuelve una lista paginada de usuarios activos (no eliminados). Se pueden aplicar filtros por nombre, tipo o estado.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de usuarios obtenida correctamente',
      schema: {
        example: {
          message: 'Lista de usuarios obtenida correctamente',
          total: 1,
          usuarios: [SwaggerUserExamples.userResponse.user],
        },
      },
    }),
  ],

  findOne: [
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
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
  ],

  update: [
    ApiOperation({
      summary: 'Actualizar un usuario existente',
      description:
        'Permite modificar los campos de un usuario existente. Solo los campos enviados en el cuerpo de la solicitud serán actualizados.',
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
            nombre: SwaggerUserExamples.updateUserBody.nombre,
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
  ],

  delete: [
    ApiOperation({
      summary: 'Eliminar (soft delete) un usuario',
      description:
        'Marca un usuario como eliminado sin borrarlo físicamente de la base de datos. El campo `eliminadoEn` se completa y el estado pasa a `ELIMINADO`.',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario marcado como eliminado',
      schema: {
        example: { message: 'Usuario marcado como eliminado (soft delete)' },
      },
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
  ],

  restore: [
    ApiOperation({
      summary: 'Restaurar un usuario eliminado',
      description:
        'Restaura un usuario que fue previamente eliminado mediante soft delete, devolviéndolo al estado `ACTIVO`.',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario restaurado correctamente',
      schema: {
        example: { message: 'Usuario restaurado correctamente' },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado o no eliminado',
    }),
  ],

  hardDelete: [
    ApiOperation({
      summary: 'Eliminar definitivamente un usuario (solo administradores)',
      description:
        'Elimina completamente al usuario de la base de datos. Esta acción no se puede deshacer. Solo los administradores pueden realizar esta operación.',
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
      status: 403,
      description: 'No tienes permisos para eliminar usuarios permanentemente',
    }),
    ApiResponse({
      status: 404,
      description: 'Usuario no encontrado',
    }),
  ],
};
