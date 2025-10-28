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
exports.UpdateUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const mapped_types_1 = require("@nestjs/mapped-types");
const create_user_dto_1 = require("./create-user.dto");
const class_validator_1 = require("class-validator");
const user_entity_1 = require("../entities/user.entity");
const user_swagger_1 = require("../docs/user.swagger");
class UpdateUserDto extends (0, mapped_types_1.PartialType)(create_user_dto_1.CreateUserDto) {
    email;
    password;
    nombre;
    apellido;
    tipo;
    estado;
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: user_swagger_1.SwaggerUserExamples.updateUserBody.email,
        description: 'Correo electrónico del usuario (solo actualizable si el sistema lo permite).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Correo electrónico inválido.' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: user_swagger_1.SwaggerUserExamples.updateUserBody.password,
        description: 'Nueva contraseña (mínimo 8 caracteres, debe tener mayúscula, minúscula y número).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 32, { message: 'La contraseña debe tener entre 8 y 32 caracteres.' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña debe incluir al menos una letra mayúscula, una minúscula y un número.',
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: user_swagger_1.SwaggerUserExamples.updateUserBody.nombre,
        description: 'Nuevo nombre del usuario.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 50),
    (0, class_validator_1.Matches)(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, {
        message: 'El nombre solo puede contener letras y espacios.',
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: user_swagger_1.SwaggerUserExamples.updateUserBody.apellido,
        description: 'Nuevo apellido del usuario.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 50),
    (0, class_validator_1.Matches)(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, {
        message: 'El apellido solo puede contener letras y espacios.',
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "apellido", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: user_swagger_1.SwaggerUserExamples.updateUserBody.tipo,
        enum: user_entity_1.TipoUsuario,
        description: 'Cambio de tipo de usuario (requiere permisos administrativos).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(user_entity_1.TipoUsuario, { message: 'Tipo de usuario inválido.' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: user_swagger_1.SwaggerUserExamples.updateUserBody.estado,
        enum: user_entity_1.EstadoUsuario,
        description: 'Actualiza el estado de la cuenta del usuario.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(user_entity_1.EstadoUsuario, { message: 'Estado de usuario inválido.' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "estado", void 0);
//# sourceMappingURL=update-user.dto.js.map