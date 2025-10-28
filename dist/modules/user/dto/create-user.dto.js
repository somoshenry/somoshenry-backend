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
        description: 'Correo electrónico único del usuario.',
        required: true,
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Correo electrónico inválido.' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: user_swagger_1.SwaggerUserExamples.createUserBody.password,
        description: 'Contraseña del usuario. Debe tener entre 8 y 32 caracteres, con al menos una letra mayúscula, una minúscula y un número.',
        required: true,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es obligatoria.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 32, { message: 'La contraseña debe tener entre 8 y 32 caracteres.' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña debe incluir al menos una letra mayúscula, una minúscula y un número.',
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: user_swagger_1.SwaggerUserExamples.createUserBody.nombre,
        description: 'Nombre del usuario. Solo letras.',
        required: true,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es obligatorio.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres.' }),
    (0, class_validator_1.Matches)(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, {
        message: 'El nombre solo puede contener letras y espacios.',
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: user_swagger_1.SwaggerUserExamples.createUserBody.apellido,
        description: 'Apellido del usuario. Solo letras.',
        required: true,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El apellido es obligatorio.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres.' }),
    (0, class_validator_1.Matches)(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, {
        message: 'El apellido solo puede contener letras y espacios.',
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "apellido", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: user_swagger_1.SwaggerUserExamples.createUserBody.tipo,
        enum: user_entity_1.TipoUsuario,
        description: 'Tipo de usuario dentro de la plataforma.',
        default: user_entity_1.TipoUsuario.MIEMBRO,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(user_entity_1.TipoUsuario, { message: 'Tipo de usuario inválido.' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: user_swagger_1.SwaggerUserExamples.createUserBody.estado,
        enum: user_entity_1.EstadoUsuario,
        description: 'Estado actual del usuario (activo, inactivo, baneado, etc.).',
        default: user_entity_1.EstadoUsuario.ACTIVO,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(user_entity_1.EstadoUsuario, { message: 'Estado de usuario inválido.' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "estado", void 0);
//# sourceMappingURL=create-user.dto.js.map