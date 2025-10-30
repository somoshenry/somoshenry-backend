import { ApiProperty } from '@nestjs/swagger';

export class CredentialDto {
  @ApiProperty({
    example: 'jhonny@example.com',
    description: 'Nombre de usuario o email para iniciar sesión',
  })
  username: string;

  @ApiProperty({
    example: 'M1c0ntr@señaSegura',
    description: 'Contraseña del usuario',
  })
  password: string;
}
