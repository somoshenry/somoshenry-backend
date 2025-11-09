import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CredentialDto {
  @ApiProperty({
    example: 'Admin123@gmail.com',
    description: 'Username del usuario para iniciar sesión',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'Admin123',
    description: 'Contraseña del usuario',
  })
  @IsString()
  password: string;
}
