import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../entities/user.entity';

export class FilterUsersDto {
  // Paginación
  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Usuarios por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Búsqueda por nombre o email
  @ApiPropertyOptional({
    description: 'Buscar por nombre o email',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  search?: string;

  // Filtro por tipo de usuario
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de usuario',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  userType?: UserRole;

  // Filtro por estado
  @ApiPropertyOptional({
    description: 'Filtrar por estado de cuenta',
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  // Filtro por ubicación
  @ApiPropertyOptional({
    description: 'Filtrar por ubicación',
    example: 'Buenos Aires',
  })
  @IsOptional()
  @IsString()
  location?: string;

  // Ordenamiento
  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    enum: ['createdAt', 'name', 'lastName'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Orden ascendente o descendente',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}
