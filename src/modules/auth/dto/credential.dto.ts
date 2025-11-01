import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CredentialDto {
  @ApiProperty({
    example: 'valen@henry.com',
    description: 'Email del usuario para iniciar sesión',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Contraseña del usuario',
  })
  @IsString()
  password: string;
}
