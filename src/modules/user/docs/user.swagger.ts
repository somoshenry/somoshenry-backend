import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const SwaggerUserExamples = {
  createUserBody: {
    email: 'valen@henry.com',
    password: 'password123',
    nombre: 'Valentín',
    apellido: 'Hernández',
    tipo: 'DOCENTE',
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
      description: 'Crea un nuevo usuario en la base de datos con los campos provistos.',
    }),
    ApiResponse({
      status: 201,
      description: 'Usuario creado exitosamente',
      schema: {
        example: SwaggerUserExamples.userResponse,
      },
    }),
  ],

  findAll: [
    ApiOperation({
      summary: 'Obtener todos los usuarios',
      description: 'Devuelve una lista de todos los usuarios registrados.',
    }),
    ApiResponse({
      status: 200,
      description: 'Lista de usuarios obtenida correctamente',
      schema: {
        example: {
          message: 'Lista de usuarios obtenida correctamente',
          users: [SwaggerUserExamples.userResponse.user],
        },
      },
    }),
  ],

  findOne: [
    ApiOperation({
      summary: 'Obtener un usuario por ID',
      description: 'Devuelve un usuario existente en base a su identificador (UUID).',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario encontrado',
      schema: {
        example: SwaggerUserExamples.userResponse,
      },
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
  ],

  update: [
    ApiOperation({
      summary: 'Actualizar un usuario existente',
      description: 'Permite modificar los campos de un usuario existente.',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario actualizado correctamente',
      schema: {
        example: {
          message: 'Usuario actualizado correctamente',
          user: SwaggerUserExamples.userResponse.user,
        },
      },
    }),
  ],

  delete: [
    ApiOperation({
      summary: 'Eliminar un usuario',
      description: 'Elimina (o da de baja) un usuario existente en la base de datos.',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario eliminado correctamente',
      schema: {
        example: { message: 'Usuario eliminado correctamente' },
      },
    }),
  ],
};
