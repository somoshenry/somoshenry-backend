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
    example: 'Desarrollador backend apasionado por NestJS',
    description: 'Biografía corta del usuario',
  })
  @IsOptional()
  @IsString()
  biography?: string; // 👈 ahora sí lo podés modificar

  @ApiPropertyOptional({
    example: 'https://miweb.com',
    description: 'Sitio web personal del usuario',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    example: 'Buenos Aires, Argentina',
    description: 'Ubicación del usuario',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.com/avatar.jpg',
    description: 'Foto de perfil',
  })
  @IsOptional()
  @IsUrl()
  profilePicture?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.com/cover.jpg',
    description: 'Foto de portada',
  })
  @IsOptional()
  @IsUrl()
  coverPicture?: string;

  @ApiPropertyOptional({
    example: 'NewPassword123',
    description: 'Contraseña nueva',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
