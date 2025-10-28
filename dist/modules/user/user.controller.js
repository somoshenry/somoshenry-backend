"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_service_1 = require("./user.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const user_swagger_1 = require("./docs/user.swagger");
const user_entity_1 = require("./entities/user.entity");
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async create(dto) {
        const user = await this.userService.create(dto);
        return { message: 'Usuario creado exitosamente', user };
    }
    async findAll(page = 1, limit = 10, nombre, tipo, estado) {
        const filters = { nombre, tipo, estado };
        const { data, total } = await this.userService.findAll(+page, +limit, filters);
        return {
            message: 'Lista de usuarios obtenida correctamente',
            total,
            usuarios: data,
        };
    }
    async findOne(id) {
        const user = await this.userService.findOne(id);
        return { message: 'Usuario encontrado', user };
    }
    async update(id, dto) {
        const updated = await this.userService.update(id, dto);
        return { message: 'Usuario actualizado correctamente', user: updated };
    }
    async softDelete(id) {
        const result = await this.userService.softDelete(id);
        return result;
    }
    async restore(id) {
        const result = await this.userService.restore(id);
        return result;
    }
    async hardDelete(id, req) {
        const userRole = req.user?.tipo || user_entity_1.TipoUsuario.ADMINISTRADOR;
        const result = await this.userService.hardDelete(id, userRole);
        return result;
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.applyDecorators)(...user_swagger_1.SwaggerUserDocs.create),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.applyDecorators)(...user_swagger_1.SwaggerUserDocs.findAll),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'nombre', required: false, example: 'Valen' }),
    (0, swagger_1.ApiQuery)({ name: 'tipo', required: false, enum: user_entity_1.TipoUsuario }),
    (0, swagger_1.ApiQuery)({ name: 'estado', required: false, enum: user_entity_1.EstadoUsuario }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('nombre')),
    __param(3, (0, common_1.Query)('tipo')),
    __param(4, (0, common_1.Query)('estado')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.applyDecorators)(...user_swagger_1.SwaggerUserDocs.findOne),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.applyDecorators)(...user_swagger_1.SwaggerUserDocs.update),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.applyDecorators)(...user_swagger_1.SwaggerUserDocs.delete),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Patch)('restore/:id'),
    (0, common_1.applyDecorators)(...user_swagger_1.SwaggerUserDocs.restore),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "restore", null);
__decorate([
    (0, common_1.Delete)('hard/:id'),
    (0, common_1.applyDecorators)(...user_swagger_1.SwaggerUserDocs.delete),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "hardDelete", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('Usuarios'),
    (0, common_1.Controller)('usuarios'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map