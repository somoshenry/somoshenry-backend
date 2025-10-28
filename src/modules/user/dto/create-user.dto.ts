import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, IsEnum } from 'class-validator';
import { EstadoUsuario, TipoUsuario } from '../entities/user.entity';
import { SwaggerUserExamples } from '../docs/user.swagger';

export class CreateUserDto {
  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.email,
    description: 'Correo electrónico único del usuario',
  })
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email: string;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.password,
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
  })
  @IsOptional()
  @IsString()
  @Length(6, 100)
  password?: string;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.nombre,
    description: 'Nombre del usuario',
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.apellido,
    description: 'Apellido del usuario',
  })
  @IsOptional()
  @IsString()
  apellido?: string;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.tipo,
    enum: TipoUsuario,
    description: 'Tipo de usuario dentro de la plataforma',
  })
  @IsOptional()
  @IsEnum(TipoUsuario)
  tipo?: TipoUsuario;

  @ApiProperty({
    example: SwaggerUserExamples.createUserBody.estado,
    enum: EstadoUsuario,
    description: 'Estado actual del usuario',
  })
  @IsOptional()
  @IsEnum(EstadoUsuario)
  estado?: EstadoUsuario;
}
