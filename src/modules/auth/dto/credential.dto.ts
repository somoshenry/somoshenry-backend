import { ApiProperty } from '@nestjs/swagger';

export class CredentialDto {
  @ApiProperty({
    example: 'valen@henry.com',
    description: 'Nombre de usuario o email para iniciar sesión',
  })
  username: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Contraseña del usuario',
  })
  password: string;
}
