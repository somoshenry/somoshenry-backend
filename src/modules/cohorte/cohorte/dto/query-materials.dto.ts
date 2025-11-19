import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  FileType,
  MaterialCategory,
} from '../entities/cohorte-material.entity';

export class QueryMaterialsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por categoría',
    enum: MaterialCategory,
  })
  @IsOptional()
  @IsEnum(MaterialCategory)
  category?: MaterialCategory;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de archivo',
    enum: FileType,
  })
  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType;

  @ApiPropertyOptional({
    description: 'Filtrar por visibilidad',
    type: Boolean,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Buscar por término (en título, descripción, fileName)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tag',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Página',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Límite de resultados',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
