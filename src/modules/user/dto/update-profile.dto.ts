import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Valentín',
    description: 'Nombre del usuario',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Hernández',
    description: 'Apellido del usuario',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'valen_henry',
    description: 'Username público',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.com/avatar.jpg',
    description: 'Foto de perfil',
  })
  @IsOptional()
  @IsUrl()
  profileImage?: string;

  @ApiPropertyOptional({
    example: 'NewPassword123',
    description: 'Contraseña nueva',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
