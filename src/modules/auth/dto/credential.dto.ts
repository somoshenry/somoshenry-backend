import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CredentialDto {
  @ApiProperty({
    example: 'valen_hernandez_11',
    description: 'Username del usuario para iniciar sesión',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Contraseña del usuario',
  })
  @IsString()
  password: string;
}
