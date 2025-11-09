import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostType } from '../../../common/enums/post-type.enum';

export class FilterPostsDto {
  // Paginación
  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Posts por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Filtro por tipo de post
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de post',
    enum: PostType,
    example: PostType.IMAGE,
  })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  // Búsqueda por contenido (texto)
  @ApiPropertyOptional({
    description: 'Buscar en el contenido del post',
    example: 'React',
  })
  @IsOptional()
  @IsString()
  search?: string;

  // Filtro por usuario
  @ApiPropertyOptional({
    description: 'Filtrar posts de un usuario específico',
    example: 'user-uuid-123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  // Filtro por rango de fechas
  @ApiPropertyOptional({
    description: 'Posts desde esta fecha',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Posts hasta esta fecha',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  // Ordenamiento
  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    enum: ['createdAt', 'updatedAt'],
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
