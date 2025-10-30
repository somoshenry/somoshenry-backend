import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { UserStatus, UserRole } from '../entities/user.entity';
import { SwaggerUserExamples } from '../docs/user.swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    example: SwaggerUserExamples.updateUserBody.email,
    description:
      'Correo electrónico del usuario (solo actualizable si el sistema lo permite).',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Correo electrónico inválido.' })
  email?: string;

  @ApiPropertyOptional({
    example: SwaggerUserExamples.updateUserBody.password,
    description:
      'Nueva contraseña (mínimo 8 caracteres, debe tener mayúscula, minúscula y número).',
  })
  @IsOptional()
  @IsString()
  @Length(8, 32, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres.',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'La contraseña debe incluir al menos una letra mayúscula, una minúscula y un número.',
  })
  password?: string;

  @ApiPropertyOptional({
    example: SwaggerUserExamples.updateUserBody.name,
    description: 'Nuevo nombre del usuario.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios.',
  })
  name?: string;

  @ApiPropertyOptional({
    example: SwaggerUserExamples.updateUserBody.lastName,
    description: 'Nuevo apellido del usuario.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, {
    message: 'El apellido solo puede contener letras y espacios.',
  })
  lastName?: string;

  @ApiPropertyOptional({
    example: SwaggerUserExamples.updateUserBody.role,
    enum: UserRole,
    description:
      'Cambio de tipo de usuario (requiere permisos administrativos).',
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Tipo de usuario inválido.' })
  role?: UserRole;

  @ApiPropertyOptional({
    example: SwaggerUserExamples.updateUserBody.status,
    enum: UserStatus,
    description: 'Actualiza el estado de la cuenta del usuario.',
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Estado de usuario inválido.' })
  status?: UserStatus;
}
