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
import { EstadoUsuario, TipoUsuario } from '../entities/user.entity';
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
    example: SwaggerUserExamples.createUserBody.nombre,
    description: 'Nombre del usuario. Solo letras.',
    required: true,
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres.' })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios.',
  })
  nombre: string;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.apellido,
    description: 'Apellido del usuario. Solo letras.',
    required: true,
  })
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  @IsString()
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres.' })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/, {
    message: 'El apellido solo puede contener letras y espacios.',
  })
  apellido: string;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.tipo,
    enum: TipoUsuario,
    description: 'Tipo de usuario dentro de la plataforma.',
    default: TipoUsuario.MIEMBRO,
  })
  @IsOptional()
  @IsEnum(TipoUsuario, { message: 'Tipo de usuario inválido.' })
  tipo?: TipoUsuario;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.estado,
    enum: EstadoUsuario,
    description: 'Estado actual del usuario (activo, inactivo, baneado, etc.).',
    default: EstadoUsuario.ACTIVO,
  })
  @IsOptional()
  @IsEnum(EstadoUsuario, { message: 'Estado de usuario inválido.' })
  estado?: EstadoUsuario;
}
