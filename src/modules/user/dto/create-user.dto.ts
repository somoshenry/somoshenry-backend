import { IsEmail, IsOptional, IsString, Length, IsEnum } from 'class-validator';
import { EstadoUsuario, TipoUsuario } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email: string;

  @IsOptional()
  @IsString()
  @Length(6, 100, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() apellido?: string;

  @IsOptional()
  @IsEnum(TipoUsuario, { message: 'Tipo de usuario inválido' })
  tipo?: TipoUsuario;

  @IsOptional()
  @IsEnum(EstadoUsuario, { message: 'Estado de usuario inválido' })
  estado?: EstadoUsuario;
}
