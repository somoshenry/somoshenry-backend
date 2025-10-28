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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const user_entity_1 = require("../entities/user.entity");
const user_swagger_1 = require("../docs/user.swagger");
class CreateUserDto {
    email;
    password;
    nombre;
    apellido;
    tipo;
    estado;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: user_swagger_1.SwaggerUserExamples.createUserBody.email,
        description: 'Correo electrónico único del usuario',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Correo electrónico inválido' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: user_swagger_1.SwaggerUserExamples.createUserBody.password,
        description: 'Contraseña del usuario (mínimo 6 caracteres)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 100),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: user_swagger_1.SwaggerUserExamples.createUserBody.nombre,
        description: 'Nombre del usuario',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: user_swagger_1.SwaggerUserExamples.createUserBody.apellido,
        description: 'Apellido del usuario',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "apellido", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: user_swagger_1.SwaggerUserExamples.createUserBody.tipo,
        enum: user_entity_1.TipoUsuario,
        description: 'Tipo de usuario dentro de la plataforma',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(user_entity_1.TipoUsuario),
    __metadata("design:type", String)
], CreateUserDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: user_swagger_1.SwaggerUserExamples.createUserBody.estado,
        enum: user_entity_1.EstadoUsuario,
        description: 'Estado actual del usuario',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(user_entity_1.EstadoUsuario),
    __metadata("design:type", String)
], CreateUserDto.prototype, "estado", void 0);
//# sourceMappingURL=create-user.dto.js.map