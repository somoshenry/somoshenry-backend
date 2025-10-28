"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerUserDocs = exports.SwaggerUserExamples = void 0;
const swagger_1 = require("@nestjs/swagger");
exports.SwaggerUserExamples = {
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
exports.SwaggerUserDocs = {
    create: [
        (0, swagger_1.ApiOperation)({
            summary: 'Crear un nuevo usuario',
            description: 'Crea un nuevo usuario en la base de datos con los campos provistos.',
        }),
        (0, swagger_1.ApiResponse)({
            status: 201,
            description: 'Usuario creado exitosamente',
            schema: {
                example: exports.SwaggerUserExamples.userResponse,
            },
        }),
    ],
    findAll: [
        (0, swagger_1.ApiOperation)({
            summary: 'Obtener todos los usuarios',
            description: 'Devuelve una lista de todos los usuarios registrados.',
        }),
        (0, swagger_1.ApiResponse)({
            status: 200,
            description: 'Lista de usuarios obtenida correctamente',
            schema: {
                example: {
                    message: 'Lista de usuarios obtenida correctamente',
                    users: [exports.SwaggerUserExamples.userResponse.user],
                },
            },
        }),
    ],
    findOne: [
        (0, swagger_1.ApiOperation)({
            summary: 'Obtener un usuario por ID',
            description: 'Devuelve un usuario existente en base a su identificador (UUID).',
        }),
        (0, swagger_1.ApiResponse)({
            status: 200,
            description: 'Usuario encontrado',
            schema: {
                example: exports.SwaggerUserExamples.userResponse,
            },
        }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Usuario no encontrado' }),
    ],
    update: [
        (0, swagger_1.ApiOperation)({
            summary: 'Actualizar un usuario existente',
            description: 'Permite modificar los campos de un usuario existente.',
        }),
        (0, swagger_1.ApiResponse)({
            status: 200,
            description: 'Usuario actualizado correctamente',
            schema: {
                example: {
                    message: 'Usuario actualizado correctamente',
                    user: exports.SwaggerUserExamples.userResponse.user,
                },
            },
        }),
    ],
    delete: [
        (0, swagger_1.ApiOperation)({
            summary: 'Eliminar un usuario',
            description: 'Elimina (o da de baja) un usuario existente en la base de datos.',
        }),
        (0, swagger_1.ApiResponse)({
            status: 200,
            description: 'Usuario eliminado correctamente',
            schema: {
                example: { message: 'Usuario eliminado correctamente' },
            },
        }),
    ],
};
//# sourceMappingURL=user.swagger.js.map