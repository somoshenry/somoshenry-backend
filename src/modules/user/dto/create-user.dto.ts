import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  IsEnum,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { UserStatus, UserRole } from '../entities/user.entity';
import { SwaggerUserExamples } from '../docs/user.swagger';

export class CreateUserDto {
  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.email,
    description: 'Correo electrónico único del usuario.',
    required: true,
  })
  @IsEmail({}, { message: 'Correo electrónico inválido.' })
  email: string;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.username,
    description:
      'Nombre de usuario único. Solo letras, números o guiones bajos. Mínimo 3 caracteres.',
    required: true,
  })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio.' })
  @IsString()
  @Length(3, 30, {
    message: 'El nombre de usuario debe tener entre 3 y 30 caracteres.',
  })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message:
      'El nombre de usuario solo puede contener letras, números y guiones bajos.',
  })
  username: string;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.password,
    description:
      'Contraseña del usuario. Debe tener entre 8 y 32 caracteres, con al menos una letra mayúscula, una minúscula y un número.',
    required: true,
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString()
  @Length(8, 32, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres.',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'La contraseña debe incluir al menos una letra mayúscula, una minúscula y un número.',
  })
  password: string;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.name,
    description: 'Nombre del usuario. Solo letras.',
    required: true,
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres.' })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios.',
  })
  name: string;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.lastName,
    description: 'Apellido del usuario. Solo letras.',
    required: true,
  })
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  @IsString()
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres.' })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, {
    message: 'El apellido solo puede contener letras y espacios.',
  })
  lastName: string;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.role,
    enum: UserRole,
    description: 'Tipo de usuario dentro de la plataforma.',
    default: UserRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Tipo de usuario inválido.' })
  role?: UserRole;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.status,
    enum: UserStatus,
    description: 'Estado actual del usuario (activo, inactivo, baneado, etc.).',
    default: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Estado de usuario inválido.' })
  status?: UserStatus;
}
