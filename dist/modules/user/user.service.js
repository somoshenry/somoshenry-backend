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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UserService = class UserService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async create(data) {
        const user = this.userRepository.create(data);
        return await this.userRepository.save(user);
    }
    async findAll(page = 1, limit = 10, filters) {
        const where = { eliminadoEn: (0, typeorm_2.IsNull)() };
        if (filters?.nombre) {
            where.nombre = (0, typeorm_2.ILike)(`%${filters.nombre}%`);
        }
        if (filters?.tipo) {
            where.tipo = filters.tipo;
        }
        if (filters?.estado) {
            where.estado = filters.estado;
        }
        const [data, total] = await this.userRepository.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
            order: { creadoEn: 'DESC' },
        });
        return { data, total };
    }
    async findOne(id) {
        const user = await this.userRepository.findOne({
            where: { id, eliminadoEn: (0, typeorm_2.IsNull)() },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return user;
    }
    async update(id, data) {
        const user = await this.findOne(id);
        const validData = Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined));
        Object.assign(user, validData);
        return await this.userRepository.save(user);
    }
    async softDelete(id) {
        const user = await this.findOne(id);
        user.estado = user_entity_1.EstadoUsuario.ELIMINADO;
        await this.userRepository.save(user);
        await this.userRepository.softDelete(id);
        return { message: 'Usuario marcado como eliminado (soft delete)' };
    }
    async restore(id) {
        const result = await this.userRepository.restore(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Usuario no encontrado o no eliminado');
        }
        await this.userRepository.update(id, { estado: user_entity_1.EstadoUsuario.ACTIVO });
        return { message: 'Usuario restaurado correctamente' };
    }
    async hardDelete(id, userRole) {
        if (userRole !== user_entity_1.TipoUsuario.ADMINISTRADOR) {
            throw new common_1.ForbiddenException('No tienes permisos para eliminar usuarios permanentemente');
        }
        const user = await this.userRepository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        await this.userRepository.remove(user);
        return { message: 'Usuario eliminado definitivamente de la base de datos' };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.Usuario)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UserService);
//# sourceMappingURL=user.service.js.map