"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerUserDocs = exports.SwaggerUserExamples = void 0;
const swagger_1 = require("@nestjs/swagger");
exports.SwaggerUserExamples = {
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
exports.SwaggerUserDocs = {
    create: [
        (0, swagger_1.ApiOperation)({
            summary: 'Crear un nuevo usuario',
            description: 'Crea un nuevo usuario en la base de datos con los campos provistos. Los campos requeridos son: email, password, nombre y apellido.',
        }),
        (0, swagger_1.ApiResponse)({
            status: 201,
            description: 'Usuario creado exitosamente',
            schema: { example: exports.SwaggerUserExamples.userResponse },
        }),
        (0, swagger_1.ApiResponse)({
            status: 400,
            description: 'Datos inválidos o faltantes',
        }),
    ],
    findAll: [
        (0, swagger_1.ApiOperation)({
            summary: 'Obtener todos los usuarios',
            description: 'Devuelve una lista paginada de usuarios activos (no eliminados). Se pueden aplicar filtros por nombre, tipo o estado.',
        }),
        (0, swagger_1.ApiResponse)({
            status: 200,
            description: 'Lista de usuarios obtenida correctamente',
            schema: {
                example: {
                    message: 'Lista de usuarios obtenida correctamente',
                    total: 1,
                    usuarios: [exports.SwaggerUserExamples.userResponse.user],
                },
            },
        }),
    ],
    findOne: [
        (0, swagger_1.ApiOperation)({
            summary: 'Obtener un usuario por ID',
            description: 'Devuelve los datos de un usuario específico mediante su identificador único (UUID).',
        }),
        (0, swagger_1.ApiResponse)({
            status: 200,
            description: 'Usuario encontrado',
            schema: { example: exports.SwaggerUserExamples.userResponse },
        }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Usuario no encontrado' }),
    ],
    update: [
        (0, swagger_1.ApiOperation)({
            summary: 'Actualizar un usuario existente',
            description: 'Permite modificar los campos de un usuario existente. Solo los campos enviados en el cuerpo de la solicitud serán actualizados.',
        }),
        (0, swagger_1.ApiResponse)({
            status: 200,
            description: 'Usuario actualizado correctamente',
            schema: {
                example: {
                    message: 'Usuario actualizado correctamente',
                    user: {
                        ...exports.SwaggerUserExamples.userResponse.user,
                        email: exports.SwaggerUserExamples.updateUserBody.email,
                        nombre: exports.SwaggerUserExamples.updateUserBody.nombre,
                    },
                },
            },
        }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Usuario no encontrado' }),
    ],
    delete: [
        (0, swagger_1.ApiOperation)({
            summary: 'Eliminar (soft delete) un usuario',
            description: 'Marca un usuario como eliminado sin borrarlo físicamente de la base de datos. El campo `eliminadoEn` se completa y el estado pasa a `ELIMINADO`.',
        }),
        (0, swagger_1.ApiResponse)({
            status: 200,
            description: 'Usuario marcado como eliminado',
            schema: {
                example: { message: 'Usuario marcado como eliminado (soft delete)' },
            },
        }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'Usuario no encontrado' }),
    ],
    restore: [
        (0, swagger_1.ApiOperation)({
            summary: 'Restaurar un usuario eliminado',
            description: 'Restaura un usuario que fue previamente eliminado mediante soft delete, devolviéndolo al estado `ACTIVO`.',
        }),
        (0, swagger_1.ApiResponse)({
            status: 200,
            description: 'Usuario restaurado correctamente',
            schema: {
                example: { message: 'Usuario restaurado correctamente' },
            },
        }),
        (0, swagger_1.ApiResponse)({
            status: 404,
            description: 'Usuario no encontrado o no eliminado',
        }),
    ],
    hardDelete: [
        (0, swagger_1.ApiOperation)({
            summary: 'Eliminar definitivamente un usuario (solo administradores)',
            description: 'Elimina completamente al usuario de la base de datos. Esta acción no se puede deshacer. Solo los administradores pueden realizar esta operación.',
        }),
        (0, swagger_1.ApiResponse)({
            status: 200,
            description: 'Usuario eliminado definitivamente de la base de datos',
            schema: {
                example: {
                    message: 'Usuario eliminado definitivamente de la base de datos',
                },
            },
        }),
        (0, swagger_1.ApiResponse)({
            status: 403,
            description: 'No tienes permisos para eliminar usuarios permanentemente',
        }),
        (0, swagger_1.ApiResponse)({
            status: 404,
            description: 'Usuario no encontrado',
        }),
    ],
};
//# sourceMappingURL=user.swagger.js.map